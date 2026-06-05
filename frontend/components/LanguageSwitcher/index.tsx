'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const toggleLanguage = () => {
    const nextLocale = locale === 'en' ? 'fr' : 'en';
    
    // Replace the current locale in the pathname
    const newPathname = pathname.replace(`/${locale}`, `/${nextLocale}`);
    
    startTransition(() => {
      router.replace(newPathname || `/${nextLocale}`);
      router.refresh();
    });
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLanguage}
      disabled={isPending}
      className="bg-card text-card-foreground border-border hover:bg-secondary hover:text-secondary-foreground transition-colors"
    >
      <Globe className="w-4 h-4 mr-2" />
      {locale === 'en' ? 'FR' : 'EN'}
    </Button>
  );
}
