import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

// Define props to allow passing width, height, color etc.
interface AppLogoProps extends SvgProps {
  color?: string;
}

export function AppLogo({ color = 'white', ...props }: AppLogoProps) {
  return (
    <Svg
      width="1024" // Default width from SVG
      height="1024" // Default height from SVG
      viewBox="0 0 1024 1024"
      fill="none"
      {...props} // Pass down other SvgProps like width, height, style
    >
      <Path
        d="M512 912C512 912 406.4 912 366.4 912C312 912 256 856 256 792C256 750.4 292.8 720 337.6 720H360V688C360 663.2 373.6 640 392 640H416V592C416 560 440 536 472 536C503.2 536 528 560 528 592V640H552C570.4 640 584 663.2 584 688V720H686.4C731.2 720 768 750.4 768 792C768 856 712 912 659.2 912C619.2 912 512 912 512 912Z"
        fill={color} // Use the color prop
      />
      <Path
        d="M512 736C512 736 404.8 592 404.8 480C404.8 402.4 465.6 336 542.4 336C619.2 336 680 402.4 680 480C680 592 572.8 736 572.8 736H512Z"
        fill={color} // Use the color prop
      />
      <Path
        d="M512 736C512 736 619.2 592 619.2 480C619.2 402.4 558.4 336 481.6 336C404.8 336 344 402.4 344 480C344 592 451.2 736 451.2 736H512Z"
        fill={color} // Use the color prop
      />
    </Svg>
  );
}

export default AppLogo; 