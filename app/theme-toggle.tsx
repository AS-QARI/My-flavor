'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let saved = 'dark';
    try {
      saved =
        localStorage.getItem('dhaiqati-theme') === 'light' ? 'light' : 'dark';
    } catch {
      /* default dark */
    }
    document.documentElement.dataset.theme = saved;
    document.documentElement.style.colorScheme = saved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', saved === 'dark' ? '#0c0f0d' : '#f7f8fa');
    setTheme(saved);
    setReady(true);
  }, []);
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', next === 'dark' ? '#0c0f0d' : '#f7f8fa');
    try {
      localStorage.setItem('dhaiqati-theme', next);
    } catch {
      /* theme still works when storage is unavailable */
    }
    setTheme(next);
  }
  return (
    <button
      type="button"
      className="theme-toggle"
      disabled={!ready}
      onClick={toggle}
      aria-label={
        theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'
      }
      title={theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      <span>{theme === 'dark' ? 'فاتح' : 'داكن'}</span>
    </button>
  );
}
