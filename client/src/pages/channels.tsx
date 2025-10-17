import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelsResponse } from "@shared/schema";
import { Search, Globe, Tag, Radio, ExternalLink, X } from "lucide-react";

export default function Channels() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const limit = 24;

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (country) queryParams.set('country', country);
  if (category) queryParams.set('category', category);
  queryParams.set('limit', limit.toString());
  queryParams.set('offset', offset.toString());

  const { data, isLoading, error } = useQuery<ChannelsResponse>({
    queryKey: ['/api/channels', search, country, category, offset],
    queryFn: async () => {
      const response = await fetch(`/api/channels?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch channels');
      return response.json();
    },
  });

  const handleClearFilters = () => {
    setSearch("");
    setCountry("");
    setCategory("");
    setOffset(0);
  };

  const hasFilters = search || country || category;
  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Radio className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Explorar Canais</h1>
          </div>
          <p className="text-muted-foreground">
            Navegue por milhares de canais IPTV gratuitos de todo o mundo
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar canais..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setOffset(0);
                  }}
                  className="pl-9"
                  data-testid="input-search-channels"
                />
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <Select value={country} onValueChange={(value) => {
                setCountry(value);
                setOffset(0);
              }}>
                <SelectTrigger data-testid="select-country">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <SelectValue placeholder="País" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os países</SelectItem>
                  {data?.countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Select value={category} onValueChange={(value) => {
                setCategory(value);
                setOffset(0);
              }}>
                <SelectTrigger data-testid="select-category">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <SelectValue placeholder="Categoria" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {data?.categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters & Clear */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {search && <Badge variant="secondary">{search}</Badge>}
              {country && <Badge variant="secondary"><Globe className="h-3 w-3 mr-1" />{country}</Badge>}
              {category && <Badge variant="secondary"><Tag className="h-3 w-3 mr-1" />{category}</Badge>}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="ml-auto gap-2"
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            </div>
          )}
        </Card>

        {/* Results count */}
        {data && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground" data-testid="text-results-count">
              {data.total} canais encontrados
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center border-destructive/20 bg-destructive/5">
            <p className="text-destructive font-semibold mb-2">Erro ao carregar canais</p>
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar a lista de canais. Tente novamente.
            </p>
          </Card>
        )}

        {/* Channels Grid */}
        {data && data.channels.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {data.channels.map((channel) => (
                <Card key={channel.id} className="p-4 hover-elevate" data-testid={`card-channel-${channel.id}`}>
                  <div className="flex items-start gap-3 mb-3">
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="h-12 w-12 rounded object-cover bg-muted"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <Radio className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1" data-testid={`text-channel-name-${channel.id}`}>
                        {channel.name}
                      </h3>
                      {channel.country && (
                        <Badge variant="secondary" className="text-xs">
                          {channel.country}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {channel.category && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                      {channel.category}
                    </p>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    asChild
                  >
                    <a href={channel.url} target="_blank" rel="noopener noreferrer" data-testid={`button-watch-${channel.id}`}>
                      <ExternalLink className="h-3 w-3" />
                      Assistir
                    </a>
                  </Button>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  data-testid="button-prev-page"
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= data.total}
                  data-testid="button-next-page"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {data && data.channels.length === 0 && (
          <Card className="p-12 text-center">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum canal encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tente ajustar os filtros de busca
            </p>
            {hasFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar filtros
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
