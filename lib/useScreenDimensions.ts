import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

type ScreenDimensions = {
  width: number;
  height: number;
  isDesktop: boolean;
};

export const useScreenDimensions = (): ScreenDimensions => {
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    isDesktop: Dimensions.get('window').width >= 768, // Consider tablet/desktop if width >= 768px
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        isDesktop: window.width >= 768,
      });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};