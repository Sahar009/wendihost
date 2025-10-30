import Link from 'next/link';

interface LogoProps {
  logoText?: string;
  className?: string;
  href?: string;
}

export default function Logo({ 
  logoText = 'Wendi', 
  className = '',
  href = '/'
}: LogoProps) {
  return (
    <Link 
      href={href} 
      className={`text-3xl font-paytone text-[#0072E9] ${className}`}
    >
      {logoText}
    </Link>
  );
}
