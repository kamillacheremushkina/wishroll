import { useEffect } from 'react';

interface CoinAlertProps {
  onClose: () => void;
}

export default function CoinAlert({ onClose }: CoinAlertProps) {
  useEffect(() => {
    // Автоматическое закрытие через 15 секунд (15000 мс)
    const timer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        // Отступаем от верха: безопасная зона + 16px (как у верхней панели) + 56px (высота монет + отступ)
        top: 'calc(max(5px, env(safe-area-inset-top)) + 56px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)', // Ширина экрана минус боковые отступы
        maxWidth: 380, // Ограничение по ширине, чтобы не было слишком широким на ПК
        background: '#125BEC',
        color: '#FFFFFF',
        padding: '10px 14px',
        borderRadius: 20,
        fontSize: 15,
        lineHeight: 1.4,
        textAlign: 'center',
        boxSizing: 'border-box',
        zIndex: 2000, // Гарантированно поверх всех экранов
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // Небольшая тень для эффекта "всплывашки"
      }}
    >
      Монеты нужны для крутки. За каждую выбранную категорию списывается 1 монета. Ежедневно доступно 9 монет.
    </div>
  );
}