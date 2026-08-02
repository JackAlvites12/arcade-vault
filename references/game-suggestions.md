# Sugerencias de juegos — Arcade Vault

Memoria del subagent `game-planner`. Append-only salvo cambio de veredicto.
Veredictos: `propuesto` | `descartado` | `implementado`.

| Fecha | Juego | id | Cat | Veredicto | Motivo |
|---|---|---|---|---|---|
| 2026-08-01 | TANQUES | tanques | VERSUS | propuesto | Ganador de la game jam "tanques", promovido a `specs/game-jam/11-implement-tanques-game.md`. Duelo 1v1 vs CPU en laberinto, balas con rebote que también te matan, mapa determinista por ronda |
| 2026-08-01 | DESLIZA | desliza | PUZZLE | propuesto | Candidato #2: PUZZLE solo tiene 1 motor real y su placeholder (caida) ya reserva el pozo de piezas; rejilla 4x4 de fusión, marcador natural |
| 2026-08-01 | MISILES | misiles | SHOOTER | propuesto | Candidato #3: shooter defensivo con ratón, distinto de invasores (oleadas) y rocas/asteroides; estética vectorial CRT ideal |
| 2026-08-01 | REBOTE (Pong) | rebote | VERSUS | descartado | `duelo-pixel` + `.cover-duelo` (dos palas, línea central, bola) ya reservan el hueco de Pong |
| 2026-08-01 | ESTELAS (Tron) | estelas | VERSUS | descartado | Estela en rejilla = misma mecánica que el motor real de `culebra` y que `serpentina` |
| 2026-08-01 | COLUMNAS | columnas | PUZZLE | descartado | Otro pozo de piezas que caen: solapa con `tetris` (motor real) y `caida` (placeholder) |
| 2026-08-01 | GALERÍA (Galaga) | galeria | SHOOTER | descartado | Oleadas de naves en formación = hueco reservado por `invasores` |
| 2026-08-01 | COMECOCOS | comecocos | ARCADE | descartado | `gloton` + `.cover-glot` ya reservan el laberinto de puntos |
| 2026-08-01 | SALTARÍN (Frogger) | saltarin | ARCADE | descartado | `ranaria` + `.cover-rana` ya reservan el cruce de carriles |
| 2026-08-01 | MINAS (Buscaminas) | minas | PUZZLE | descartado | Su puntuación natural es tiempo (menor = mejor) y el leaderboard ordena score DESC |
| 2026-08-01 | SEÑAL (Simon) | senal | PUZZLE | descartado | Profundidad baja y marcador de dos cifras; sesión dominada por animaciones de espera |
| 2026-08-01 | DEFENSOR (Defender) | defensor | SHOOTER | descartado | Scroll lateral + radar + rescates: coste alto para el patrón `engine.ts` + canvas actual |
| 2026-08-01 | ARENA ONLINE | arena-online | VERSUS | descartado | Exige infraestructura de red/multijugador remoto, fuera del alcance del patrón actual |
| 2026-08-01 | HEXÁGONO | hexagono | ARCADE | propuesto | Anillos que colapsan al centro con rotación global; reflejo puro, geometría radial inédita, primer magenta en ARCADE |
| 2026-08-01 | PIRÁMIDE | piramide | ARCADE | propuesto | Q*bert isométrico: único candidato con vidas y niveles reales que llenan el HUD compartido |
| 2026-08-01 | TORRE | torre | ARCADE | propuesto | Apilar bloques por timing con un solo botón; motor mínimo (intersección de intervalos). Requiere la regla de "perfecto recupera anchura" o no hay juego |
| 2026-08-01 | TRAZO | trazo | ARCADE | propuesto | Qix: conquista de área con estela temporal + flood fill. Verbo inédito en catálogo; la lógica de cierre necesita test propio |
| 2026-08-01 | TUBERÍA | tuberia | PUZZLE | propuesto | Colocar tubos contra un flujo que avanza; PUZZLE + magenta, sin pozo ni piezas que caen |
| 2026-08-01 | DESPLOME | desplome | PUZZLE | propuesto | Same-game de grupos de color con gravedad; único puzzle sin reloj. Siembra determinista por nivel para que el leaderboard mida skill |
| 2026-08-01 | BURBUJAS | burbujas | PUZZLE | propuesto | Puzzle Bobble en rejilla hexagonal; el más atractivo pero mayor superficie de bug (coordenadas hex) |
| 2026-08-01 | BLANCOS | blancos | SHOOTER | propuesto | Galería de tiro con ratón, sin nave ni proyectil simulado; primer magenta en SHOOTER, el más barato del lote |
| 2026-08-01 | NÚCLEO | nucleo | SHOOTER | propuesto | Bullet-hell contra un jefe central; invierte el género (el peligro es la bala). Mejor escaparate visual CRT |
| 2026-08-01 | ENJAMBRE | enjambre | SHOOTER | propuesto | Twin-stick de arena cerrada (WASD + ratón). La spec debe fijar "sin inercia, paredes sólidas" o se percibe como reskin de asteroides |
| 2026-08-01 | TÚNEL | tunel | SHOOTER | propuesto | Scramble: scroll con terreno como array de alturas, combustible agotable. Garantizar hueco mínimo por construcción |
| 2026-08-01 | CARAMBOLA | carambola | SHOOTER | propuesto | Cañón fijo con balas que rebotan; único shooter no reactivo. Encaje de categoría discutible (roza PUZZLE) |
| 2026-08-01 | VOLEA | volea | VERSUS | propuesto | Slime volley con gravedad y red; el más barato de VERSUS, IA = predecir la parábola con error calibrado |
| 2026-08-01 | OBÚS | obus | VERSUS | descartado | Game jam "tanques": artillería por turnos, terreno como array de alturas. Descartado frente a `tanques` por coste (integrador con subpasos + terreno destructible + IA balística) |
| 2026-08-01 | MECHAS | mechas | VERSUS | propuesto | Bomberman 1v1; el más caro y el único cuya diversión depende de la IA (BFS con mapa de peligro y explosiones en cadena) |
| 2026-08-01 | JUSTA | justa | VERSUS | propuesto | Joust: combate por altura con aleteo; IA barata (objetivo desplazado), riesgo en el tuning del control |
| 2026-08-01 | CUATRO | cuatro | VERSUS | propuesto | Conecta 4 con minimax alfa-beta; la única dificultad verdadera (profundidad = nivel), pero el menos arcade y marcador sintético |
| 2026-08-01 | APILA | apila | PUZZLE | descartado | Duplicado de `torre` generado en paralelo; se conserva `torre` en ARCADE, que es su categoría natural |
| 2026-08-01 | CONQUISTA | conquista | PUZZLE | descartado | Duplicado de `trazo` generado en paralelo; Qix es arcade, se conserva `trazo` |
| 2026-08-01 | TÚNEL (variante cueva) | tunel-arcade | ARCADE | descartado | Duplicado de `tunel`; se conserva la variante SHOOTER, más rica (disparo + combustible) |
| 2026-08-01 | BARRIL (Donkey Kong) | barril | ARCADE | descartado | Plataformas con escaleras y niveles diseñados a mano: coste fuera del patrón engine.ts + canvas |
| 2026-08-01 | CAVADOR (Dig Dug) | cavador | ARCADE | descartado | Túneles excavables + enemigos inflables + rocas: tres subsistemas para poco retorno |
| 2026-08-01 | CUBETA (Kaboom!) | cubeta | ARCADE | descartado | Atrapar con pala solapa con `arkanoid` y la profundidad es mínima |
| 2026-08-01 | PINBALL | pinball | ARCADE | descartado | Colisiones contra superficies curvas: exige motor físico |
| 2026-08-01 | TOPOS | topos | ARCADE | descartado | Reflejo sin progresión; marcador lineal que no diferencia jugadores |
| 2026-08-01 | ATERRIZA (Lunar Lander) | aterriza | ARCADE | descartado | Rotar + empujar + inercia = núcleo exacto de `asteroides` |
| 2026-08-01 | BOMBAS (Bomberman 1P) | bombas | ARCADE | descartado | Sin rival pierde la gracia; su hueco natural es VERSUS, cubierto por `mechas` |
| 2026-08-01 | CARRIL (Freeway) | carril | ARCADE | descartado | Cruzar carriles de tráfico es el hueco reservado por `ranaria` |
| 2026-08-01 | RITMO | ritmo | ARCADE | descartado | Depende de assets de audio sincronizados que no existen en el repo |
| 2026-08-01 | RALLY (maze race) | rally | ARCADE | descartado | Laberinto con perseguidores = hueco de `gloton`, solo cambia el sprite |
| 2026-08-01 | GEMAS (Bejeweled) | gemas | PUZZLE | descartado | Solapa con `desplome` (match de color en rejilla) y su motor es más caro por swap y cascadas |
| 2026-08-01 | CAJAS (Sokoban) | cajas | PUZZLE | descartado | Puntuación natural = movimientos (menor mejor) y exige corpus de niveles a mano |
| 2026-08-01 | NONOGRAMA | nonograma | PUZZLE | descartado | Mismo problema de contenido; marcador honesto sería tiempo/errores |
| 2026-08-01 | LUCES (Lights Out) | luces | PUZZLE | descartado | Profundidad baja en 5x5, mismo perfil que `senal` |
| 2026-08-01 | MEMORIA (parejas) | memoria | PUZZLE | descartado | Sin techo de habilidad; el leaderboard se satura en la primera semana |
| 2026-08-01 | ROTOR (Net) | rotor | PUZZLE | descartado | Solapa con `tuberia` y su marcador natural vuelve a ser tiempo |
| 2026-08-01 | LABERINTO GRAVEDAD | laberinto-gravedad | PUZZLE | descartado | Física continua contra geometría arbitraria: fuera del coste del patrón actual |
| 2026-08-01 | CAZA (shmup vertical) | caza | SHOOTER | descartado | Es el hueco reservado por `invasores`; ya descartado como `galeria` |
| 2026-08-01 | CINTURÓN | cinturon | SHOOTER | descartado | Variante de `asteroides` + `rocas`: solape doble |
| 2026-08-01 | TORRETA | torreta | SHOOTER | descartado | Solapa con `misiles` (propuesto) y con la defensa estática de `invasores` |
| 2026-08-01 | FRANCOTIRADOR | francotirador | SHOOTER | descartado | Depende de sprites/fondos detallados inexistentes; no se lee en canvas vectorial |
| 2026-08-01 | ESCUADRÓN | escuadron | SHOOTER | descartado | El coste está en la UX de control; alto riesgo de ilegibilidad con la paleta actual |
| 2026-08-01 | ASEDIO (tipo Worms) | asedio | SHOOTER | descartado | Turnos contra CPU con puntería: es un VERSUS disfrazado, cubierto por `obus` |
| 2026-08-01 | PROFUNDIDAD | profundidad | SHOOTER | descartado | Es `misiles` invertido: mismo proyectil temporizado con detonación en área |
| 2026-08-01 | AIRE (air hockey) | aire | VERSUS | descartado | Pong con dos ejes; `duelo-pixel` + `.cover-duelo` ya reservan el hueco |
| 2026-08-01 | MURALLAS (Warlords) | murallas | VERSUS | descartado | Bola + rebote + ladrillos solapa de frente con el motor real de `arkanoid` |
| 2026-08-01 | DISCOS (Windjammers) | discos | VERSUS | descartado | Indistinguible de `duelo-pixel` en miniatura y en la primera partida |
| 2026-08-01 | KÁRATE | karate | VERSUS | descartado | Exige sprites de animación por frame; con formas geométricas el género no se sostiene |
| 2026-08-01 | EMPUJE (sumo) | empuje | VERSUS | descartado | Misma escena y misma sensación que `tanques`, ya propuesto |
| 2026-08-01 | RÁPIDO (desenfundar) | rapido | VERSUS | descartado | Sesión de ~15 s dominada por esperas; score = tiempo de reacción, encaje forzado en leaderboard DESC |
| 2026-08-01 | ORUGA | oruga | ARCADE | descartado | Game jam "tanques": scroll lateral sin disparo, terreno como cola de segmentos. Descartado frente a `tanques`; ARCADE ya es la categoría más poblada |
| 2026-08-01 | ATASCO (Rush Hour blindado) | atasco | PUZZLE | descartado | Game jam "tanques": mismo problema que `cajas` — exige corpus de niveles a mano (o un solver para generarlos) y su score natural es nº de movimientos, menor mejor |
| 2026-08-01 | TORRE DE MANDO (tower defense) | torre-mando | PUZZLE | descartado | Game jam "tanques": oleadas + pathfinding + economía de torres son tres subsistemas fuera del coste de `engine.ts` + canvas |
| 2026-08-01 | PELOTÓN (twin-stick blindado) | peloton | SHOOTER | descartado | Game jam "tanques": es `enjambre` (ya propuesto) con sprite de tanque; mismo verbo que `tanques` de esta jam |
