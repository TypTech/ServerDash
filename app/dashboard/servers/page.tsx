"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Servers from "./Servers"
import axios from "axios";

export default function DashboardPage() {
    const router = useRouter();
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) {
            router.push("/");
        } else {
            const checkToken = async () => {
                try {
                    const response = await axios.post("/api/auth/validate", {
                        token: token,
                    });

                    if (response.status === 200) {
                        setIsValid(true);
                    }
                } catch (error: any) {
                    Cookies.remove("token");
                    router.push("/");
                }
            }
            checkToken();
        }
        setIsAuthChecked(true);
    }, [router]);

    if (!isAuthChecked) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className='inline-block' role='status' aria-label='loading'>
                <svg className='w-6 h-6 stroke-white animate-spin ' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <g clip-path='url(#clip0_9023_61563)'>
                    <path d='M14.6437 2.05426C11.9803 1.2966 9.01686 1.64245 6.50315 3.25548C1.85499 6.23817 0.504864 12.4242 3.48756 17.0724C6.47025 21.7205 12.6563 23.0706 17.3044 20.088C20.4971 18.0393 22.1338 14.4793 21.8792 10.9444' stroke='stroke-current' stroke-width='1.4' stroke-linecap='round' className='my-path'></path>
                </g>
                <defs>
                    <clipPath id='clip0_9023_61563'>
                    <rect width='24' height='24' fill='white'></rect>
                    </clipPath>
                </defs>
                </svg>
                <span className='sr-only'>Loading...</span>
                </div>
            </div>
        )
    }

    return isValid ? <Servers /> : null;
}