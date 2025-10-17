import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Home from "@/pages/home";
import Channels from "@/pages/channels";
import NotFound from "@/pages/not-found";
import { Home as HomeIcon, Radio } from "lucide-react";

function Router() {
  const [location] = useLocation();
  
  return (
    <>
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Radio className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">IPTV Server</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link href="/" data-testid="link-home">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Início
                </Link>
              </Button>
              
              <Button
                variant={location === "/channels" ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link href="/channels" data-testid="link-channels">
                  <Radio className="h-4 w-4 mr-2" />
                  Canais
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/channels" component={Channels} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
