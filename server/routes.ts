import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  parseM3U,
  filterChannels,
  getUniqueValues,
  type Channel,
} from "./m3u-parser";
import rateLimit from "express-rate-limit";

// Playlist sources com fallback
const PLAYLIST_SOURCES = [
  "https://iptv-org.github.io/iptv/countries/br.m3u",
  // você pode adicionar mais URLs de backup aqui
];

let currentSourceIndex = 0;
const startTime = Date.now();

// Cache em memória
let cachedChannels: Channel[] = [];
let cachedPlaylist: string = "";
let cacheTimestamp = 0;
const CACHE_DURATION = 3600 * 1000; // 1 hora

const EXTRA_BR = `
#EXTINF:-1 group-title="Brazil",BR: LIGA FUTSAL HD
http://tooontv.com:999/live/ere3444h/agape/199106.ts
#EXTINF:-1 group-title="Brazil",BR: TNT Sports Estadio 6 HD
http://tooontv.com:999/live/ere3444h/agape/199107.ts
#EXTINF:-1 group-title="Brazil",BR: TNT Sports Estadio 5 HD
http://tooontv.com:999/live/ere3444h/agape/199108.ts
#EXTINF:-1 group-title="Brazil",BR: TNT Sports Estadio 4 HD
http://tooontv.com:999/live/ere3444h/agape/199109.ts
#EXTINF:-1 group-title="Brazil",BR: TNT Sports Estadio 3 HD
http://tooontv.com:999/live/ere3444h/agape/199110.ts
#EXTINF:-1 group-title="Brazil",BR: TNT Sports Estadio 2 HD
http://tooontv.com:999/live/ere3444h/agape/199111.ts
#EXTINF:-1 group-title="Brazil",BR: TNT Sports Estadio 1 HD
http://tooontv.com:999/live/ere3444h/agape/199112.ts
#EXTINF:-1 group-title="Brazil",BR: DAZN 4 HD
http://tooontv.com:999/live/ere3444h/agape/199113.ts
#EXTINF:-1 group-title="Brazil",BR: DAZN 3 HD
http://tooontv.com:999/live/ere3444h/agape/199114.ts
#EXTINF:-1 group-title="Brazil",BR: DAZN 2 HD
http://tooontv.com:999/live/ere3444h/agape/199115.ts
#EXTINF:-1 group-title="Brazil",BR: DAZN 1 HD
http://tooontv.com:999/live/ere3444h/agape/199116.ts
#EXTINF:-1 group-title="Brazil",BR: HBO Max 6 HD
http://tooontv.com:999/live/ere3444h/agape/199117.ts
#EXTINF:-1 group-title="Brazil",BR: HBO Max 5 HD
http://tooontv.com:999/live/ere3444h/agape/199118.ts
#EXTINF:-1 group-title="Brazil",BR: HBO Max 4 HD
http://tooontv.com:999/live/ere3444h/agape/199119.ts
#EXTINF:-1 group-title="Brazil",BR: HBO Max 3 HD
http://tooontv.com:999/live/ere3444h/agape/199120.ts
#EXTINF:-1 group-title="Brazil",BR: HBO Max 2 HD
http://tooontv.com:999/live/ere3444h/agape/199121.ts
#EXTINF:-1 group-title="Brazil",BR: HBO Max 1 HD
http://tooontv.com:999/live/ere3444h/agape/199122.ts
#EXTINF:-1 group-title="Brazil",BR: STAR+ 7 HD
http://tooontv.com:999/live/ere3444h/agape/199123.ts
#EXTINF:-1 group-title="Brazil",BR: STAR+ 6 HD
http://tooontv.com:999/live/ere3444h/agape/199124.ts
#EXTINF:-1 group-title="Brazil",BR: STAR+ 5 HD
http://tooontv.com:999/live/ere3444h/agape/199125.ts
#EXTINF:-1 group-title="Brazil",BR: STAR+ 4 HD
http://tooontv.com:999/live/ere3444h/agape/199126.ts
#EXTINF:-1 group-title="Brazil",BR: STAR+ 3 HD
http://tooontv.com:999/live/ere3444h/agape/199127.ts
#EXTINF:-1 group-title="Brazil",BR: STAR+ 2 HD
http://tooontv.com:999/live/ere3444h/agape/199128.ts
#EXTINF:-1 group-title="Brazil",BR: STAR+ 1 HD
http://tooontv.com:999/live/ere3444h/agape/199129.ts
#EXTINF:-1 group-title="Brazil",BR: TV Carioca HD
http://tooontv.com:999/live/ere3444h/agape/199130.ts
#EXTINF:-1 group-title="Brazil",BR: SBT SP
http://tooontv.com:999/live/ere3444h/agape/199131.ts
#EXTINF:-1 group-title="Brazil",BR: Conmebol 1 FHD
http://tooontv.com:999/live/ere3444h/agape/199132.ts
#EXTINF:-1 group-title="Brazil",BR: Conmebol 2 FHD
http://tooontv.com:999/live/ere3444h/agape/199133.ts
#EXTINF:-1 group-title="Brazil",BR: Conmebol 3 FHD
http://tooontv.com:999/live/ere3444h/agape/199134.ts
#EXTINF:-1 group-title="Brazil",BR: Conmebol 4 FHD
http://tooontv.com:999/live/ere3444h/agape/199135.ts
#EXTINF:-1 group-title="Brazil",BR: Premiere 7 FHD
http://tooontv.com:999/live/ere3444h/agape/199136.ts
#EXTINF:-1 group-title="Brazil",BR: Premiere 6 FHD
http://tooontv.com:999/live/ere3444h/agape/199137.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RPC Ponta Grossa FHD
http://tooontv.com:999/live/ere3444h/agape/199138.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RPC Maringa FHD
http://tooontv.com:999/live/ere3444h/agape/199139.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RPC Foz do Iguaçu FHD
http://tooontv.com:999/live/ere3444h/agape/199140.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RPC Curitiba FHD
http://tooontv.com:999/live/ere3444h/agape/199141.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RJ FHD
http://tooontv.com:999/live/ere3444h/agape/199142.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Rede Amazonica FHD
http://tooontv.com:999/live/ere3444h/agape/199143.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RBS TV Santa Maria FHD
http://tooontv.com:999/live/ere3444h/agape/199144.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RBS TV POA FHD
http://tooontv.com:999/live/ere3444h/agape/199145.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RBS TV Pelotas FHD
http://tooontv.com:999/live/ere3444h/agape/199146.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RBS TV Caxias do Sul FHD
http://tooontv.com:999/live/ere3444h/agape/199147.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RBS TV 4K
http://tooontv.com:999/live/ere3444h/agape/199148.ts
#EXTINF:-1 group-title="Brazil",BR: Globo NSC TV Joinville FHD
http://tooontv.com:999/live/ere3444h/agape/199149.ts
#EXTINF:-1 group-title="Brazil",BR: Globo NSC TV Criciuma FHD
http://tooontv.com:999/live/ere3444h/agape/199150.ts
#EXTINF:-1 group-title="Brazil",BR: Globo NSC TV Chapeco FHD
http://tooontv.com:999/live/ere3444h/agape/199151.ts
#EXTINF:-1 group-title="Brazil",BR: Globo NSC TV Blumenau FHD
http://tooontv.com:999/live/ere3444h/agape/199152.ts
#EXTINF:-1 group-title="Brazil",BR: Globo NSC Florianopolis FHD
http://tooontv.com:999/live/ere3444h/agape/199153.ts
#EXTINF:-1 group-title="Brazil",BR: Globo NSC Centro Oeste FHD
http://tooontv.com:999/live/ere3444h/agape/199154.ts
#EXTINF:-1 group-title="Brazil",BR: Globo NOW
http://tooontv.com:999/live/ere3444h/agape/199155.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Nordeste FHD
http://tooontv.com:999/live/ere3444h/agape/199156.ts
#EXTINF:-1 group-title="Brazil",BR: Globo News FHD
http://tooontv.com:999/live/ere3444h/agape/199157.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Minas FHD
http://tooontv.com:999/live/ere3444h/agape/199158.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Inter TV Grande Minas FHD
http://tooontv.com:999/live/ere3444h/agape/199159.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Inter TV Cabugi FHD
http://tooontv.com:999/live/ere3444h/agape/199160.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Inter TV Alto Litoral FHD
http://tooontv.com:999/live/ere3444h/agape/199161.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Inter PT FHD
http://tooontv.com:999/live/ere3444h/agape/199162.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Inter Cabugi HD
http://tooontv.com:999/live/ere3444h/agape/199163.ts
#EXTINF:-1 group-title="Brazil",BR: Globo EPTV São Carlos
http://tooontv.com:999/live/ere3444h/agape/199164.ts
#EXTINF:-1 group-title="Brazil",BR: Globo EPTV Sul de Minas FHD
http://tooontv.com:999/live/ere3444h/agape/199165.ts
#EXTINF:-1 group-title="Brazil",BR: Globo EPTV Ribeirão Preto
http://tooontv.com:999/live/ere3444h/agape/199166.ts
#EXTINF:-1 group-title="Brazil",BR: Globo EPTV Campinas FHD
http://tooontv.com:999/live/ere3444h/agape/199167.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Centro America FHD
http://tooontv.com:999/live/ere3444h/agape/199168.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Amazônica HD
http://tooontv.com:999/live/ere3444h/agape/199169.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Amazonica Manaus HD
http://tooontv.com:999/live/ere3444h/agape/199170.ts
#EXTINF:-1 group-title="Brazil",BR:TNT SPORTS 1 HD
http://tooontv.com:999/live/ere3444h/agape/199171.ts
#EXTINF:-1 group-title="Brazil",BR:TNT SPORTS 2 HD
http://tooontv.com:999/live/ere3444h/agape/199172.ts
#EXTINF:-1 group-title="Brazil",BR:TNT SPORTS 3 HD
http://tooontv.com:999/live/ere3444h/agape/199173.ts
#EXTINF:-1 group-title="Brazil",BR:TNT SPORTS 4 HD
http://tooontv.com:999/live/ere3444h/agape/199174.ts
#EXTINF:-1 group-title="Brazil",BR:TNT SPORTS 5 HD
http://tooontv.com:999/live/ere3444h/agape/199175.ts
#EXTINF:-1 group-title="Brazil",BR:TNT SPORTS 6 HD
http://tooontv.com:999/live/ere3444h/agape/199176.ts
#EXTINF:-1 group-title="Brazil",BR: WOOHOO HD
http://tooontv.com:999/live/ere3444h/agape/199177.ts
#EXTINF:-1 group-title="Brazil",BR: WARNER CHANNEL HD
http://tooontv.com:999/live/ere3444h/agape/199178.ts
#EXTINF:-1 group-title="Brazil",BR: Viva
http://tooontv.com:999/live/ere3444h/agape/199179.ts
#EXTINF:-1 group-title="Brazil",BR: UNIVERSAL CHANNEL HD
http://tooontv.com:999/live/ere3444h/agape/199180.ts
#EXTINF:-1 group-title="Brazil",BR: TNT SERIES HD
http://tooontv.com:999/live/ere3444h/agape/199181.ts
#EXTINF:-1 group-title="Brazil",BR: TNT Series
http://tooontv.com:999/live/ere3444h/agape/199182.ts
#EXTINF:-1 group-title="Brazil",BR: TNT HD
http://tooontv.com:999/live/ere3444h/agape/199183.ts
#EXTINF:-1 group-title="Brazil",BR: TNT
http://tooontv.com:999/live/ere3444h/agape/199184.ts
#EXTINF:-1 group-title="Brazil",BR: TLC
http://tooontv.com:999/live/ere3444h/agape/199185.ts
#EXTINF:-1 group-title="Brazil",BR: Telecine Touch
http://tooontv.com:999/live/ere3444h/agape/199186.ts
#EXTINF:-1 group-title="Brazil",BR: TELECINE PREMIUM HD
http://tooontv.com:999/live/ere3444h/agape/199187.ts
#EXTINF:-1 group-title="Brazil",BR: TELECINE PIPOCA HD
http://tooontv.com:999/live/ere3444h/agape/199188.ts
#EXTINF:-1 group-title="Brazil",BR: Telecine Pipoca
http://tooontv.com:999/live/ere3444h/agape/199189.ts
#EXTINF:-1 group-title="Brazil",BR: TELECINE FUN HD
http://tooontv.com:999/live/ere3444h/agape/199190.ts
#EXTINF:-1 group-title="Brazil",BR: TELECINE CULT HD
http://tooontv.com:999/live/ere3444h/agape/199191.ts
#EXTINF:-1 group-title="Brazil",BR: Telecine Cult
http://tooontv.com:999/live/ere3444h/agape/199192.ts
#EXTINF:-1 group-title="Brazil",BR: TELECINE ACTION HD
http://tooontv.com:999/live/ere3444h/agape/199193.ts
#EXTINF:-1 group-title="Brazil",BR: SYFY HD
http://tooontv.com:999/live/ere3444h/agape/199194.ts
#EXTINF:-1 group-title="Brazil",BR: SyFy
http://tooontv.com:999/live/ere3444h/agape/199195.ts
#EXTINF:-1 group-title="Brazil",BR: STUDIO UNIVERSAL HD
http://tooontv.com:999/live/ere3444h/agape/199196.ts
#EXTINF:-1 group-title="Brazil",BR: SPORTV HD
http://tooontv.com:999/live/ere3444h/agape/199197.ts
#EXTINF:-1 group-title="Brazil",BR: SPORTV 3 HD
http://tooontv.com:999/live/ere3444h/agape/199198.ts
#EXTINF:-1 group-title="Brazil",BR: Sportv 3
http://tooontv.com:999/live/ere3444h/agape/199199.ts
#EXTINF:-1 group-title="Brazil",BR: SPORTV 2 HD
http://tooontv.com:999/live/ere3444h/agape/199083.ts
#EXTINF:-1 group-title="Brazil",BR: SporTV 2
http://tooontv.com:999/live/ere3444h/agape/199060.ts
#EXTINF:-1 group-title="Brazil",BR: SPACE HD
http://tooontv.com:999/live/ere3444h/agape/199075.ts
#EXTINF:-1 group-title="Brazil",BR: SONY HD
http://tooontv.com:999/live/ere3444h/agape/199200.ts
#EXTINF:-1 group-title="Brazil",BR: Sony
http://tooontv.com:999/live/ere3444h/agape/199074.ts
#EXTINF:-1 group-title="Brazil",BR: SBT
http://tooontv.com:999/live/ere3444h/agape/199040.ts
#EXTINF:-1 group-title="Brazil",BR: REDE TV HD
http://tooontv.com:999/live/ere3444h/agape/199201.ts
#EXTINF:-1 group-title="Brazil",BR: Rede New
http://tooontv.com:999/live/ere3444h/agape/199064.ts
#EXTINF:-1 group-title="Brazil",BR: RECORD SP HD
http://tooontv.com:999/live/ere3444h/agape/199051.ts
#EXTINF:-1 group-title="Brazil",BR: Record
http://tooontv.com:999/live/ere3444h/agape/199059.ts
#EXTINF:-1 group-title="Brazil",BR: PREMIERE CLUBES HD
http://tooontv.com:999/live/ere3444h/agape/199202.ts
#EXTINF:-1 group-title="Brazil",BR: PREMIERE 5 HD
http://tooontv.com:999/live/ere3444h/agape/199078.ts
#EXTINF:-1 group-title="Brazil",BR: PREMIERE 4 HD
http://tooontv.com:999/live/ere3444h/agape/199071.ts
#EXTINF:-1 group-title="Brazil",BR: PREMIERE 3 HD
http://tooontv.com:999/live/ere3444h/agape/199087.ts
#EXTINF:-1 group-title="Brazil",BR: PREMIERE 2 HD
http://tooontv.com:999/live/ere3444h/agape/199030.ts
#EXTINF:-1 group-title="Brazil",BR: PARAMOUNT CHANNEL HD
http://tooontv.com:999/live/ere3444h/agape/199054.ts
#EXTINF:-1 group-title="Brazil",BR: Paramount
http://tooontv.com:999/live/ere3444h/agape/199089.ts
#EXTINF:-1 group-title="Brazil",BR: OFF HD
http://tooontv.com:999/live/ere3444h/agape/199069.ts
#EXTINF:-1 group-title="Brazil",BR: NICKELODEON HD
http://tooontv.com:999/live/ere3444h/agape/199068.ts
#EXTINF:-1 group-title="Brazil",BR: Nickelodeon
http://tooontv.com:999/live/ere3444h/agape/199058.ts
#EXTINF:-1 group-title="Brazil",BR: NICK JR HD
http://tooontv.com:999/live/ere3444h/agape/199095.ts
#EXTINF:-1 group-title="Brazil",BR: NATIONAL GEOGRAPHIC HD
http://tooontv.com:999/live/ere3444h/agape/199046.ts
#EXTINF:-1 group-title="Brazil",BR: NATGEO WILD HD
http://tooontv.com:999/live/ere3444h/agape/199203.ts
#EXTINF:-1 group-title="Brazil",BR: Nat Geo Kids
http://tooontv.com:999/live/ere3444h/agape/199042.ts
#EXTINF:-1 group-title="Brazil",BR: Nat Geo
http://tooontv.com:999/live/ere3444h/agape/199088.ts
#EXTINF:-1 group-title="Brazil",BR: MULTISHOW HD
http://tooontv.com:999/live/ere3444h/agape/199070.ts
#EXTINF:-1 group-title="Brazil",BR: MTV
http://tooontv.com:999/live/ere3444h/agape/199080.ts
#EXTINF:-1 group-title="Brazil",BR: MEGAPIX HD
http://tooontv.com:999/live/ere3444h/agape/199204.ts
#EXTINF:-1 group-title="Brazil",BR: Megapix
http://tooontv.com:999/live/ere3444h/agape/199076.ts
#EXTINF:-1 group-title="Brazil",BR: LIFETIME HD
http://tooontv.com:999/live/ere3444h/agape/199100.ts
#EXTINF:-1 group-title="Brazil",BR: Life Time
http://tooontv.com:999/live/ere3444h/agape/199086.ts
#EXTINF:-1 group-title="Brazil",BR: ID - INVESTIGACAO DISCOVERY HD
http://tooontv.com:999/live/ere3444h/agape/199029.ts
#EXTINF:-1 group-title="Brazil",BR: HISTORY CHANNEL HD
http://tooontv.com:999/live/ere3444h/agape/199023.ts
#EXTINF:-1 group-title="Brazil",BR: HBO SIGNATURE HD
http://tooontv.com:999/live/ere3444h/agape/199045.ts
#EXTINF:-1 group-title="Brazil",BR: HBO Plus
http://tooontv.com:999/live/ere3444h/agape/199105.ts
#EXTINF:-1 group-title="Brazil",BR: HBO HD
http://tooontv.com:999/live/ere3444h/agape/199036.ts
#EXTINF:-1 group-title="Brazil",BR: HBO FAMILY HD
http://tooontv.com:999/live/ere3444h/agape/199027.ts
#EXTINF:-1 group-title="Brazil",BR: HBO Family
http://tooontv.com:999/live/ere3444h/agape/199049.ts
#EXTINF:-1 group-title="Brazil",BR: HBO 2 HD
http://tooontv.com:999/live/ere3444h/agape/199103.ts
#EXTINF:-1 group-title="Brazil",BR: HBO 2
http://tooontv.com:999/live/ere3444h/agape/199056.ts
#EXTINF:-1 group-title="Brazil",BR: HBO
http://tooontv.com:999/live/ere3444h/agape/199035.ts
#EXTINF:-1 group-title="Brazil",BR: H2 HD
http://tooontv.com:999/live/ere3444h/agape/199020.ts
#EXTINF:-1 group-title="Brazil",BR: H2
http://tooontv.com:999/live/ere3444h/agape/199091.ts
#EXTINF:-1 group-title="Brazil",BR: GNT HD
http://tooontv.com:999/live/ere3444h/agape/199065.ts
#EXTINF:-1 group-title="Brazil",BR: GNT
http://tooontv.com:999/live/ere3444h/agape/199099.ts
#EXTINF:-1 group-title="Brazil",BR: GLOOB HD
http://tooontv.com:999/live/ere3444h/agape/199082.ts
#EXTINF:-1 group-title="Brazil",BR: GLOBOSAT HD
http://tooontv.com:999/live/ere3444h/agape/199205.ts
#EXTINF:-1 group-title="Brazil",BR: GLOBO SP HD
http://tooontv.com:999/live/ere3444h/agape/199024.ts
#EXTINF:-1 group-title="Brazil",BR: Globo SP
http://tooontv.com:999/live/ere3444h/agape/199206.ts
#EXTINF:-1 group-title="Brazil",BR: GLOBO RJ HD
http://tooontv.com:999/live/ere3444h/agape/199053.ts
#EXTINF:-1 group-title="Brazil",BR: Globo RJ
http://tooontv.com:999/live/ere3444h/agape/199055.ts
#EXTINF:-1 group-title="Brazil",BR: GLOBO NORDESTE HD
http://tooontv.com:999/live/ere3444h/agape/199101.ts
#EXTINF:-1 group-title="Brazil",BR: Globo News
http://tooontv.com:999/live/ere3444h/agape/199104.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Brasilia
http://tooontv.com:999/live/ere3444h/agape/199041.ts
#EXTINF:-1 group-title="Brazil",BR: Globo Bahia
http://tooontv.com:999/live/ere3444h/agape/199047.ts
#EXTINF:-1 group-title="Brazil",BR: FX
http://tooontv.com:999/live/ere3444h/agape/199038.ts
#EXTINF:-1 group-title="Brazil",BR: FOX SPORTS 2 HD
http://tooontv.com:999/live/ere3444h/agape/199092.ts
#EXTINF:-1 group-title="Brazil",BR: Fox Sports 2
http://tooontv.com:999/live/ere3444h/agape/199066.ts
#EXTINF:-1 group-title="Brazil",BR: Fox Sports 1
http://tooontv.com:999/live/ere3444h/agape/199022.ts
#EXTINF:-1 group-title="Brazil",BR: FOX PREMIUM 1 HD
http://tooontv.com:999/live/ere3444h/agape/199025.ts
#EXTINF:-1 group-title="Brazil",BR: FOX LIFE HD
http://tooontv.com:999/live/ere3444h/agape/199021.ts
#EXTINF:-1 group-title="Brazil",BR: Fox Life
http://tooontv.com:999/live/ere3444h/agape/199207.ts
#EXTINF:-1 group-title="Brazil",BR: FOX HD
http://tooontv.com:999/live/ere3444h/agape/199026.ts
#EXTINF:-1 group-title="Brazil",BR: FOX
http://tooontv.com:999/live/ere3444h/agape/199084.ts
#EXTINF:-1 group-title="Brazil",BR: FOOD NETWORK HD
http://tooontv.com:999/live/ere3444h/agape/199061.ts
#EXTINF:-1 group-title="Brazil",BR: ESPN BRASIL HD
http://tooontv.com:999/live/ere3444h/agape/199032.ts
#EXTINF:-1 group-title="Brazil",BR: ESPN Brasil
http://tooontv.com:999/live/ere3444h/agape/199090.ts
#EXTINF:-1 group-title="Brazil",BR: ESPN  HD
http://tooontv.com:999/live/ere3444h/agape/199063.ts
#EXTINF:-1 group-title="Brazil",BR: ESPN
http://tooontv.com:999/live/ere3444h/agape/199077.ts
#EXTINF:-1 group-title="Brazil",BR: E!
http://tooontv.com:999/live/ere3444h/agape/199028.ts
#EXTINF:-1 group-title="Brazil",BR: DISNEY XD HD
http://tooontv.com:999/live/ere3444h/agape/199033.ts
#EXTINF:-1 group-title="Brazil",BR: DISNEY JR HD
http://tooontv.com:999/live/ere3444h/agape/199079.ts
#EXTINF:-1 group-title="Brazil",BR: Disney JR
http://tooontv.com:999/live/ere3444h/agape/199062.ts
#EXTINF:-1 group-title="Brazil",BR: DISNEY CHANNEL HD
http://tooontv.com:999/live/ere3444h/agape/199208.ts
#EXTINF:-1 group-title="Brazil",BR: Disney channel
http://tooontv.com:999/live/ere3444h/agape/199050.ts
#EXTINF:-1 group-title="Brazil",BR: DISCOVERY WORLD HD
http://tooontv.com:999/live/ere3444h/agape/199072.ts
#EXTINF:-1 group-title="Brazil",BR: DISCOVERY TURBO HD
http://tooontv.com:999/live/ere3444h/agape/199039.ts
#EXTINF:-1 group-title="Brazil",BR: Discovery Turbo
http://tooontv.com:999/live/ere3444h/agape/199073.ts
#EXTINF:-1 group-title="Brazil",BR: DISCOVERY THEATER HD
http://tooontv.com:999/live/ere3444h/agape/199031.ts
#EXTINF:-1 group-title="Brazil",BR: DISCOVERY KIDS HD
http://tooontv.com:999/live/ere3444h/agape/199043.ts
#EXTINF:-1 group-title="Brazil",BR: DISCOVERY HOME & HEALTH HD
http://tooontv.com:999/live/ere3444h/agape/199019.ts
#EXTINF:-1 group-title="Brazil",BR: Discovery H&H
http://tooontv.com:999/live/ere3444h/agape/199209.ts
#EXTINF:-1 group-title="Brazil",BR: DISCOVERY SCIENCE HD
http://tooontv.com:999/live/ere3444h/agape/199067.ts
#EXTINF:-1 group-title="Brazil",BR: DISCOVERY CHANNEL HD
http://tooontv.com:999/live/ere3444h/agape/199037.ts
#EXTINF:-1 group-title="Brazil",BR: COMEDY CENTRAL HD
http://tooontv.com:999/live/ere3444h/agape/199097.ts
#EXTINF:-1 group-title="Brazil",BR: Comedy Central
http://tooontv.com:999/live/ere3444h/agape/199210.ts
#EXTINF:-1 group-title="Brazil",BR: COMBATE HD
http://tooontv.com:999/live/ere3444h/agape/199094.ts
#EXTINF:-1 group-title="Brazil",BR: Combate
http://tooontv.com:999/live/ere3444h/agape/199211.ts
#EXTINF:-1 group-title="Brazil",BR: Cinemax
http://tooontv.com:999/live/ere3444h/agape/199212.ts
#EXTINF:-1 group-title="Brazil",BR: Cartoon Network
http://tooontv.com:999/live/ere3444h/agape/199057.ts
#EXTINF:-1 group-title="Brazil",BR: BOOMERANG HD
http://tooontv.com:999/live/ere3444h/agape/199096.ts
#EXTINF:-1 group-title="Brazil",BR: Boomerang
http://tooontv.com:999/live/ere3444h/agape/199044.ts
#EXTINF:-1 group-title="Brazil",BR: BAND SPORTS HD
http://tooontv.com:999/live/ere3444h/agape/199085.ts
#EXTINF:-1 group-title="Brazil",BR: Band Sports
http://tooontv.com:999/live/ere3444h/agape/199093.ts
#EXTINF:-1 group-title="Brazil",BR: BAND SP HD
http://tooontv.com:999/live/ere3444h/agape/199081.ts
#EXTINF:-1 group-title="Brazil",BR: BAND NEWS HD
http://tooontv.com:999/live/ere3444h/agape/199102.ts
#EXTINF:-1 group-title="Brazil",BR: Band News
http://tooontv.com:999/live/ere3444h/agape/199098.ts
#EXTINF:-1 group-title="Brazil",BR: AXN HD
http://tooontv.com:999/live/ere3444h/agape/199052.ts
#EXTINF:-1 group-title="Brazil",BR: AXN
http://tooontv.com:999/live/ere3444h/agape/199048.ts
#EXTINF:-1 group-title="Brazil",BR: ANIMAL PLANET HD
http://tooontv.com:999/live/ere3444h/agape/199034.ts
#EXTINF:-1 group-title="Brazil",BR: AMC
http://tooontv.com:999/live/ere3444h/agape/199015.ts
#EXTINF:-1 group-title="Brazil",BR: A & E
http://tooontv.com:999/live/ere3444h/agape/199007.ts
#EXTINF:-1 group-title="Brazil",BR:  Telecine Premium
http://tooontv.com:999/live/ere3444h/agape/199017.ts
#EXTINF:-1 group-title="Brazil",BR:  Telecine Fun
http://tooontv.com:999/live/ere3444h/agape/199016.ts
#EXTINF:-1 group-title="Brazil",BR:  Telecine Action
http://tooontv.com:999/live/ere3444h/agape/199009.ts
#EXTINF:-1 group-title="Brazil",BR:  SporTV 1
http://tooontv.com:999/live/ere3444h/agape/199006.ts
#EXTINF:-1 group-title="Brazil",BR:  History Channel
http://tooontv.com:999/live/ere3444h/agape/199012.ts
#EXTINF:-1 group-title="Brazil",BR:  Disney XD
http://tooontv.com:999/live/ere3444h/agape/199014.ts
#EXTINF:-1 group-title="Brazil",BR:  Discovery Channel HD
http://tooontv.com:999/live/ere3444h/agape/199011.ts
#EXTINF:-1 group-title="Brazil",BR:  Band HD
http://tooontv.com:999/live/ere3444h/agape/199018.ts
#EXTINF:-1 group-title="Brazil",BR: ESPN 2HD
http://tooontv.com:999/live/ere3444h/agape/199010.ts
#EXTINF:-1 group-title="Brazil",BR: Dazn 1
http://tooontv.com:999/live/ere3444h/agape/199008.ts
#EXTINF:-1 group-title="Brazil",BR: Dazn 2
http://tooontv.com:999/live/ere3444h/agape/199013.ts
`;

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

const playlistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many playlist requests, please try again later.",
});

// Função para buscar playlist de forma resiliente
async function fetchFromSources(): Promise<string> {
  const totalSources = PLAYLIST_SOURCES.length;
  for (let i = 0; i < totalSources; i++) {
    const index = (currentSourceIndex + i) % totalSources;
    try {
      const response = await fetch(PLAYLIST_SOURCES[index]);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      currentSourceIndex = index; // atualiza fonte atual
      return text;
    } catch (err) {
      console.warn(`Falha ao buscar fonte [${PLAYLIST_SOURCES[index]}]:`, err);
    }
  }
  throw new Error("Todas as fontes falharam");
}

// Atualiza cache de forma assíncrona
async function updateCache() {
  try {
    const playlistText = await fetchFromSources();
    cachedPlaylist = playlistText;
    cachedChannels = parseM3U(playlistText);
    cacheTimestamp = Date.now();
    console.log("Cache atualizado com sucesso!");
  } catch (err) {
    console.error("Falha ao atualizar cache:", err);
  }
}

// Inicializa cache ao ligar o servidor
updateCache();
setInterval(updateCache, CACHE_DURATION); // atualiza a cada hora

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/status", (req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    res.json({
      status: "online",
      source: PLAYLIST_SOURCES[currentSourceIndex],
      sources: PLAYLIST_SOURCES,
      port: parseInt(process.env.PORT || "5000"),
      uptime,
    });
  });

  app.get("/api/channels", apiLimiter, async (req, res) => {
    try {
      const now = Date.now();
      if (!cachedChannels.length || now - cacheTimestamp > CACHE_DURATION) {
        await updateCache();
      }

      const filters = {
        country: req.query.country as string,
        category: req.query.category as string,
        search: req.query.search as string,
        limit: req.query.limit
          ? Math.min(parseInt(req.query.limit as string), 100)
          : 50,
        offset: req.query.offset
          ? Math.max(parseInt(req.query.offset as string), 0)
          : 0,
      };

      const filtered = filterChannels(cachedChannels, filters);
      const countries = getUniqueValues(cachedChannels, "country");
      const categories = getUniqueValues(cachedChannels, "category");

      res.json({
        channels: filtered.channels,
        total: filtered.total,
        countries,
        categories,
      });
    } catch (error) {
      console.error("Erro ao buscar canais:", error);
      res.status(500).json({ error: "Failed to fetch channels" });
    }
  });

  app.get("/playlist.m3u", playlistLimiter, async (req, res) => {
    try {
      const now = Date.now();
      if (!cachedPlaylist || now - cacheTimestamp > CACHE_DURATION) {
        await updateCache();
      }

      res.set("Content-Type", "application/vnd.apple.mpegurl");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(`${cachedPlaylist.trim()}\n${EXTRA_BR.trim()}`);
    } catch (error) {
      console.error("Erro ao buscar playlist:", error);
      res.status(502).json({
        error: "Failed to fetch playlist",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return createServer(app);
}
