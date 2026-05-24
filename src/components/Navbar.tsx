'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CalendarIcon, BoltIcon, DropletIcon } from './icons';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Mes', Icon: CalendarIcon },
    { href: '/registros/luz', label: 'Luz', Icon: BoltIcon },
    { href: '/registros/agua', label: 'Agua', Icon: DropletIcon },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className="font-semibold text-lg mr-4 text-gray-800 flex items-center gap-1.5">
          <HomeIcon className="w-5 h-5" /> Gastos Casa
        </span>
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname === href
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
