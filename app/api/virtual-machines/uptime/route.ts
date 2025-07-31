import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RequestBody {
  timespan?: number
  page?: number
  itemsPerPage?: number
}

interface VirtualMachine {
  id: number
  name: string
  publicURL: string
  localURL: string | null
  uptimecheckUrl: string | null
  online: boolean
}

interface UptimeRecord {
  id: number
  virtualMachineId: number
  online: boolean
  createdAt: Date
}

// Helper function to get time range based on timespan
function getTimeRange(timespan: number): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  
  switch (timespan) {
    case 1: // Last 1 hour
      start.setHours(end.getHours() - 1)
      break
    case 2: // Last 1 day
      start.setDate(end.getDate() - 1)
      break
    case 3: // Last 7 days
      start.setDate(end.getDate() - 7)
      break
    case 4: // Last 30 days
      start.setDate(end.getDate() - 30)
      break
    default:
      start.setHours(end.getHours() - 1)
  }
  
  return { start, end }
}

// Helper function to generate intervals for the chart
function generateIntervals(timespan: number): string[] {
  const intervals: string[] = []
  const { start, end } = getTimeRange(timespan)
  
  let current = new Date(start)
  let step: number
  let formatOptions: Intl.DateTimeFormatOptions
  
  switch (timespan) {
    case 1: // Last 1 hour - 5 minute intervals
      step = 5 * 60 * 1000
      formatOptions = { hour: '2-digit', minute: '2-digit' }
      break
    case 2: // Last 1 day - 1 hour intervals
      step = 60 * 60 * 1000
      formatOptions = { hour: '2-digit', minute: '2-digit' }
      break
    case 3: // Last 7 days - 6 hour intervals
      step = 6 * 60 * 60 * 1000
      formatOptions = { month: 'short', day: 'numeric', hour: '2-digit' }
      break
    case 4: // Last 30 days - 1 day intervals
      step = 24 * 60 * 60 * 1000
      formatOptions = { month: 'short', day: 'numeric' }
      break
    default:
      step = 5 * 60 * 1000
      formatOptions = { hour: '2-digit', minute: '2-digit' }
  }
  
  while (current <= end) {
    intervals.push(current.toLocaleString('en-US', formatOptions))
    current = new Date(current.getTime() + step)
  }
  
  return intervals
}

// Helper function to calculate uptime percentage for a virtual machine
function calculateUptimePercentage(
  virtualMachineId: number,
  uptimeHistory: UptimeRecord[]
): number {
  const vmHistory = uptimeHistory.filter(record => record.virtualMachineId === virtualMachineId)
  
  if (vmHistory.length === 0) return 100 // No history means assume online
  
  const onlineCount = vmHistory.filter(record => record.online).length
  return Math.round((onlineCount / vmHistory.length) * 100)
}

// Helper function to get uptime data for chart
function getUptimeChartData(
  virtualMachineId: number,
  uptimeHistory: UptimeRecord[],
  intervals: string[],
  timespan: number
): number[] {
  const vmHistory = uptimeHistory.filter(record => record.virtualMachineId === virtualMachineId)
  const { start } = getTimeRange(timespan)
  
  return intervals.map((interval, index) => {
    const intervalStart = new Date(start.getTime() + (index * getIntervalStep(timespan)))
    const intervalEnd = new Date(intervalStart.getTime() + getIntervalStep(timespan))
    
    const intervalRecords = vmHistory.filter(record => 
      record.createdAt >= intervalStart && record.createdAt < intervalEnd
    )
    
    if (intervalRecords.length === 0) return 100 // No data means assume online
    
    const onlineCount = intervalRecords.filter(record => record.online).length
    return Math.round((onlineCount / intervalRecords.length) * 100)
  })
}

function getIntervalStep(timespan: number): number {
  switch (timespan) {
    case 1: return 5 * 60 * 1000     // 5 minutes
    case 2: return 60 * 60 * 1000    // 1 hour
    case 3: return 6 * 60 * 60 * 1000 // 6 hours
    case 4: return 24 * 60 * 60 * 1000 // 1 day
    default: return 5 * 60 * 1000
  }
}

export async function POST(request: NextRequest) {
    try {
      const { timespan = 1, page = 1, itemsPerPage = 5 }: RequestBody = await request.json();
      const skip = (page - 1) * itemsPerPage;
  
      // Get paginated and sorted virtual machines
      const [virtualMachines, totalCount] = await Promise.all([
        prisma.virtual_machine.findMany({
          skip,
          take: itemsPerPage,
          orderBy: { name: 'asc' }
        }),
        prisma.virtual_machine.count()
      ]);
  
      const virtualMachineIds = virtualMachines.map((vm: VirtualMachine) => vm.id);
      
      // Get time range and intervals
      const { start } = getTimeRange(timespan);
      const intervals = generateIntervals(timespan);
  
      // Get uptime history for the filtered virtual machines
      const uptimeHistory = await prisma.uptime_history.findMany({
        where: {
          virtualMachineId: { in: virtualMachineIds },
          createdAt: { gte: start }
        },
        orderBy: { createdAt: "desc" }
      });
  
      // Calculate uptime data for each virtual machine
      const uptimeData = virtualMachines.map((vm: VirtualMachine) => {
        const uptimePercentage = calculateUptimePercentage(vm.id, uptimeHistory);
        const chartData = getUptimeChartData(vm.id, uptimeHistory, intervals, timespan);
        
        return {
          id: vm.id,
          name: vm.name,
          publicURL: vm.publicURL,
          localURL: vm.localURL,
          uptimecheckUrl: vm.uptimecheckUrl,
          online: vm.online,
          uptimePercentage,
          chartData
        };
      });
  
      return NextResponse.json({
        data: uptimeData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          totalItems: totalCount
        },
        intervals
      });
  
    } catch (error: any) {
      console.error('Virtual machine uptime error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}