import React from "react";
import Link from 'next/link';
import { useUser } from "@/context/userContext";
import { useRouter } from "next/router";

const Header: React.FC = () => {
    const { user, setUser } = useUser();
    const router = useRouter();

    const login = user != null;

    const handleLogout = () => {
        setUser(null);

        router.push("/");
    }

    const handleLogo = () => {
        if (login) {
            router.push("/home");
        } else {
            router.push("/");
        }
    }

    return (
        <header className="flex justify-between items-center p-4 bg-[#132D5F] text-white">
            <div>
                <button onClick={handleLogo} className="flex justify-between font-mono font-bold text-2xl">
                    <img src="/icons/logo.png" className="object-scale-down h-10 w-10"></img>
                    <p className="px-2 content-center">Scriptorium</p>
                </button>
            </div>
            <nav>
                <Link href="/home" className="mx-5">Home</Link>
                <Link href="/code" className="mx-5">Code</Link>
                {login && <button className="mx-5" onClick={handleLogout}>Logout</button>}
            </nav>
        </header>
    );
};

export default Header;