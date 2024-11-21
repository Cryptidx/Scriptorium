import React from "react";
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center p-4 bg-[#132D5F] text-white">
      <div>
        <Link href="/" className="flex justify-between font-mono font-bold text-2xl">
            <img src="/icons/logo.png" className="object-scale-down h-10 w-10"></img>
            <p className="px-2 content-center">Scriptorium</p>
        </Link>
      </div>
      <nav>
        <Link href="/home" style={{ margin: '0 1rem' }}>Home</Link>
        <Link href="/code">Code</Link>
      </nav>
    </header>
  );
};

export default Header;