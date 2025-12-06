import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface SplashScreenProps {
  onFinished: () => void;
}

const SplashScreen = ({ onFinished }: SplashScreenProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    // Give time for the fade-out animation to complete
    setTimeout(onFinished, 500);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-pink-100 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-modal="true"
      role="dialog"
    >
      <div className="text-center">
        <img src="/assets/logo-CalMyCare.png" alt="CalMyCare Logo" className="w-32 h-32 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Halo Bunda, selamat datang.</h1>
        <Button onClick={handleClose} variant="outline" className="bg-white text-pink-500 border-pink-500 hover:bg-pink-50">
          Lanjutkan
        </Button>
      </div>
    </div>
  );
};

export default SplashScreen;
