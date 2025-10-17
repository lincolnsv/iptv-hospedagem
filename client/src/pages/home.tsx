import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerStatusType } from "@shared/schema";
import { Server, Radio, Copy, CheckCircle, Clock, Play, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading, error } = useQuery<ServerStatusType>({
    queryKey: ['/api/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const playlistUrl = `${window.location.origin}/playlist.m3u`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(playlistUrl);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "URL da playlist copiada para a área de transferência",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar URL",
        variant: "destructive",
      });
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Radio className="h-12 w-12 md:h-16 md:w-16 text-primary" />
              {status?.status === 'online' && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                </span>
              )}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            IPTV Streaming Server
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Servidor IPTV gratuito com canais ao vivo de todo o mundo
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : error ? (
              <Badge 
                variant="outline" 
                className="text-sm px-3 py-1 bg-destructive/10 border-destructive/20 text-destructive"
                data-testid="badge-server-error"
              >
                <AlertCircle className="h-3 w-3 mr-2" />
                Erro de Conexão
              </Badge>
            ) : status && (
              <Badge 
                variant="outline" 
                className="text-sm px-3 py-1 bg-primary/10 border-primary/20 text-primary"
                data-testid="badge-server-status"
              >
                <span className="h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                Servidor Online
              </Badge>
            )}
          </div>
        </div>

        {/* Main Endpoint Card */}
        <Card className="p-6 md:p-8 mb-8" data-testid="card-playlist-endpoint">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Play className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                  GET
                </Badge>
                <h3 className="text-lg font-semibold">Playlist Endpoint</h3>
              </div>
              
              <div className="bg-muted/50 rounded-md p-3 mb-4 font-mono text-sm break-all">
                {playlistUrl}
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Endpoint principal para acesso à playlist M3U com todos os canais IPTV disponíveis
              </p>
              
              <Button 
                onClick={copyToClipboard} 
                variant="outline" 
                size="sm"
                className="gap-2"
                data-testid="button-copy-url"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar URL
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Start Guide */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Como Usar</h2>
          
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Copie a URL da Playlist</h3>
                  <p className="text-sm text-muted-foreground">
                    Use o botão "Copiar URL" acima para copiar o endereço da playlist M3U
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Abra seu Player IPTV</h3>
                  <p className="text-sm text-muted-foreground">
                    Use VLC, Kodi, IPTV Smarters ou qualquer player compatível com M3U
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cole a URL e Assista</h3>
                  <p className="text-sm text-muted-foreground">
                    Cole a URL copiada no seu player e comece a assistir os canais disponíveis
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Server Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-6 border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Erro ao carregar status do servidor</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Não foi possível conectar ao servidor. Tente novamente.
                </p>
              </div>
            </div>
          </Card>
        ) : status && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Porta</p>
                  <p className="text-lg font-semibold" data-testid="text-server-port">{status.port}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Online</p>
                  <p className="text-lg font-semibold" data-testid="text-server-uptime">
                    {formatUptime(status.uptime)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Radio className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="text-lg font-semibold">M3U</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Playlist fornecida por{" "}
            <a 
              href="https://github.com/iptv-org/iptv" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              IPTV-org
            </a>
          </p>
          
          {status && status.sources && status.sources.length > 1 && (
            <div className="text-xs text-muted-foreground">
              <p className="mb-2">Fontes de playlist configuradas ({status.sources.length}):</p>
              <div className="flex flex-wrap justify-center gap-2">
                {status.sources.map((src, idx) => (
                  <Badge 
                    key={idx} 
                    variant={src === status.source ? "default" : "outline"}
                    className="font-mono text-xs"
                  >
                    {idx === status.sources.indexOf(status.source) ? '✓ ' : ''}
                    Fonte {idx + 1}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
