import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function CookingAnimation() {
  return (
    <DotLottieReact
      src="/Cooking.lottie"
      loop
      autoplay
      className="w-full max-w-125 h-125 max-md:w-80 max-md:h-80 relative z-10"
    />
  );
}