
import React, { Suspense, Component, ReactNode } from 'react';
import { Masthead3D } from './components/Masthead3D';
import { YouTubeIcon, PatreonIcon, InstagramIcon, TikTokIcon } from './components/Icons';
import { SocialLink } from './types';

// Updated with the new requested video ID
const LATEST_VIDEO_ID = "O24z1zOOuks"; 

// Props and State interfaces for ErrorBoundary
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error Boundary to catch 3D crashes so the rest of the site stays up
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Define state property explicitly
  state: ErrorBoundaryState = { hasError: false };

  // Explicit constructor to ensure props are correctly initialized in types
  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Masthead3D Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Define the links and their data here for easy modification
const SOCIAL_LINKS: SocialLink[] = [
  {
    name: 'YOUTUBE',
    url: 'https://www.youtube.com/@goblingrafix',
    icon: YouTubeIcon,
  },
  {
    name: 'PATREON',
    url: 'https://www.patreon.com/GoblinGrafix',
    icon: PatreonIcon,
  },
  {
    name: 'INSTAGRAM',
    url: 'https://www.instagram.com/goblingrafix/',
    icon: InstagramIcon,
  },
  {
    name: 'TIKTOK',
    url: 'https://www.tiktok.com/@goblingrafix',
    icon: TikTokIcon,
  },
];

const App: React.FC = () => {
  return (
    <div className="min-h-screen text-white selection:bg-white selection:text-black flex flex-col bg-transparent">
      
      {/* 1. THE FANCY MASTHEAD */}
      {/* Wrapped in ErrorBoundary and Suspense for safety */}
      <ErrorBoundary fallback={
        <div className="h-[400px] w-full flex flex-col items-center justify-center border-b-2 border-zinc-800 text-zinc-500 font-bold">
          <h1 className="text-4xl md:text-6xl text-white mb-4">GOBLIN GRAFIX</h1>
          <p>[ 3D MODULE FAILED TO LOAD ]</p>
        </div>
      }>
        <Suspense fallback={<div className="h-[400px] w-full flex items-center justify-center border-b-2 border-zinc-800 text-zinc-500">LOADING 3D ASSETS...</div>}>
          <Masthead3D />
        </Suspense>
      </ErrorBoundary>

      <main className="flex-grow flex flex-col items-center px-4 pb-12 pt-0 max-w-2xl mx-auto w-full">
        
        {/* Intro Text */}
        <div className="mb-8 text-center max-w-lg">
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed tracking-widest">
            Esoteric knowledge from my twisted mind
          </p>
        </div>

        {/* Latest Video Embed */}
        <div className="mb-16 w-full max-w-lg flex flex-col items-center">
          <div className="w-full aspect-video border-2 border-zinc-800 bg-black p-1 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${LATEST_VIDEO_ID}`} 
              title="My latest video"
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="w-full h-full bg-zinc-900"
            ></iframe>
          </div>
          <p className="mt-4 text-zinc-400 text-sm md:text-base leading-relaxed tracking-widest">
            My latest video!
          </p>
        </div>

        {/* 2. STACKED LONG BAR LINKS */}
        <div className="flex flex-col w-full gap-4 mb-16">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-between w-full p-4 md:p-6 bg-black/50 hover:bg-zinc-900 border-2 border-zinc-800 hover:border-white transition-all duration-300 backdrop-blur-sm"
              aria-label={`Visit ${link.name}`}
            >
              <div className="flex items-center gap-6">
                <div className="text-3xl text-zinc-400 group-hover:text-white transition-colors duration-200">
                  <link.icon />
                </div>
                <span className="text-xl md:text-2xl font-bold tracking-widest text-zinc-300 group-hover:text-white transition-colors">
                  {link.name}
                </span>
              </div>
              
              {/* Arrow or visual indicator */}
              <div className="text-zinc-600 group-hover:text-white transition-colors transform group-hover:translate-x-1 duration-200 font-bold">
                &gt;&gt;
              </div>

              {/* Corner accents for techy feel */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-transparent group-hover:border-white transition-all duration-300" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-transparent group-hover:border-white transition-all duration-300" />
            </a>
          ))}
        </div>

      </main>
    </div>
  );
};

export default App;
