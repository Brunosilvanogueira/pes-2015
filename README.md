# PES Spirit 2015 (Prototype Jogável)

Este repositório agora contém um **jogo de futebol jogável no navegador**, inspirado na sensação de controle e ritmo de PES 2015.

## Como jogar agora
1. Abra `index.html` no navegador.
2. Jogue imediatamente (não precisa instalar dependências).

## Controles
- `WASD`: mover jogador selecionado
- `Shift`: sprint (consome stamina)
- `J`: passe / bote defensivo
- `K`: chute
- `L`: trocar jogador
- `R`: reiniciar partida

## O que já foi implementado
- Partida completa em campo 2D com placar e cronômetro.
- Controle manual do jogador com troca de atleta.
- Passe, chute e disputa de bola.
- IA adversária com estilo tático “compacta”.
- Sistema simples de stamina e emoção impactando desempenho.
- HUD com informações de partida em tempo real.

## Próximos incrementos
- Goleiros dedicados com lógica de defesa.
- Faltas/cartões e arbitragem.
- Mais estilos táticos por time.
- Sistema de carreira/liga e editor de elenco.
- Multiplayer local/online.
# Projeto: Sucessor Espiritual de PES 2015

> Visão: criar um jogo de futebol competitivo, técnico e viciante, com identidade própria, inspirado na filosofia **"The Pitch is Ours"**.

Este documento define a base técnica e de produto para iniciar o desenvolvimento de um jogo de futebol **profissional** (escopo AAA), priorizando:
- jogabilidade realista, responsiva e estratégica;
- controle total do jogador;
- ritmo de partida intenso e orgânico;
- sistemas escaláveis para modos offline e online.

---

## 1) Direção de Produto e Princípios de Design

### Pilares de gameplay
1. **Controle primeiro**: cada comando deve ter resposta previsível e com baixa latência.
2. **Futebol de decisões**: leitura tática, posicionamento e timing valem mais que “combos”.
3. **Física com identidade**: bola e contato corporal críveis, sem cair no caos.
4. **Expressão por estilo**: times e atletas com comportamentos diferentes.
5. **Profundidade sustentável**: fácil de jogar, difícil de dominar.

### Regras de ouro (não-negociáveis)
- Nada de soluções puramente arcade no loop principal.
- Inputs com buffer e cancel windows claros para consistência competitiva.
- IA com objetivos táticos e contexto de jogo (placar, tempo, fadiga, moral).
- Câmera e HUD desenhadas para leitura de espaço e tomada de decisão rápida.

---

## 2) Stack Tecnológica Recomendada

## Escolha principal: **Unreal Engine 5 (C++ + Blueprints)**

### Frontend / Client
- **UE5.4+** para rendering, animação avançada, ferramentas de profiling e multiplayer.
- **Gameplay Ability System (GAS)** para ações, estados e custos (stamina, pressão emocional).
- **Enhanced Input** para sistema de controle granular e configurável.
- **Chaos Physics** para colisões e integração com física da bola (com ajustes customizados).
- **Control Rig + Motion Warping + IK Retargeting** para animações naturais e responsivas.

### Backend / Online
- **Arquitetura de serviços em Go ou C# (ASP.NET Core)** para matchmaking, contas, inventário de elenco, ligas e telemetria.
- **gRPC interno** entre serviços + **REST/JSON** para operações externas.
- **Redis** (cache/sessão), **PostgreSQL** (dados persistentes), **Kafka/NATS** (eventos de jogo e analytics).
- **Dedicated Servers** com orquestração em **Kubernetes**.

### DevOps / Ferramentas
- CI/CD: GitHub Actions + runners próprios para builds de engine.
- Observabilidade: OpenTelemetry + Prometheus + Grafana.
- Crash e logs: Sentry/Backtrace + data lake de telemetria de gameplay.
- Entrega de conteúdo: CDN com versionamento por temporada.

### Alternativa viável
- **Unity DOTS + Netcode + Havok Physics** (boa performance), mas UE5 tende a acelerar produção AAA para futebol simulado devido ao pipeline de animação e ferramentas integradas.

---

## 3) Arquitetura Completa do Projeto

## 3.1 Visão em camadas

1. **Core Domain (C++)**
   - Regras de futebol, estados de partida, arbitragem, atributos, progressão.
2. **Simulation Layer**
   - Bola, movimento de jogadores, colisão, fadiga, emocional, tomada de decisão IA.
3. **Gameplay Orchestration**
   - Controle, seleção de jogador, habilidades, transições ataque/defesa, set pieces.
4. **Presentation Layer**
   - Animação, câmera, HUD, áudio reativo, replay.
5. **Online & Persistence**
   - Sincronização, rollback/prediction, saves, perfis e modos de carreira.
6. **Tools & Modding Layer**
   - Editores internos/externos, import/export de dados, APIs de conteúdo.

## 3.2 Arquitetura orientada a módulos

- `MatchSimulation`
- `PlayerControllerSystem`
- `TeamTacticsAI`
- `BallPhysics`
- `AnimationRuntime`
- `CameraDirector`
- `RefereeRules`
- `CareerAndEconomy`
- `ClubBuilderMode`
- `OnlineServicesIntegration`
- `SaveGameSystem`
- `ModSupport`

Cada módulo expõe interfaces estáveis e eventos para desacoplamento.

---

## 4) Estrutura de Pastas (proposta)

```txt
/pes-successor
  /Build
  /Config
  /Content
    /Art
    /Audio
    /UI
    /Animations
    /Cinematics
  /Source
    /Game
      /Core
        MatchRules/
        Entities/
        Attributes/
        Economy/
      /Gameplay
        PlayerInput/
        BallControl/
        Passing/
        Shooting/
        Dribbling/
        Defending/
        Goalkeeping/
      /Simulation
        BallPhysics/
        Movement/
        Collision/
        FatigueEmotion/
      /AI
        TacticalBrain/
        TeamStyle/
        RoleBehaviors/
        DecisionScoring/
      /Animation
        Locomotion/
        StateMachines/
        MotionMatching/
        IK/
      /Camera
        Broadcast/
        Tactical/
        Replay/
      /Modes
        QuickMatch/
        MasterLeague/
        Cup/
        League/
        PlayerCareer/
        SquadBuilder/
      /Online
        Netcode/
        Matchmaking/
        Session/
      /UI
        Menus/
        HUD/
        SquadManagement/
      /Persistence
        SaveLoad/
        Profiles/
      /Tools
        Editors/
        Validation/
      /Modding
        APIs/
        Importers/
  /Server
    /Gateway
    /Matchmaking
    /PlayerProfile
    /Economy
    /Telemetry
  /Docs
    architecture/
    gameplay/
    ai/
    physics/
    production/
  /Tests
    /Unit
    /Integration
    /Simulation
    /Network
```

---

## 5) Sistema Central de Gameplay

## 5.1 Loop base por frame
1. Ler input local/remoto.
2. Resolver intenção contextual (passe curto, passe em profundidade, chute colocado etc.).
3. Avaliar constraints (equilíbrio corporal, pé dominante, pressão adversária, fadiga).
4. Aplicar ação no modelo físico/tático.
5. Atualizar animação com blending e correções IK.
6. Publicar eventos para HUD, áudio e replay.

## 5.2 Ações principais
- **Passe**: força + direção + assistência opcional por nível de dificuldade.
- **Chute**: tipo (colocado, potência, cobertura), equilíbrio corporal e pressão do marcador.
- **Cruzamento**: curva, altura, zona de destino e intenção do atacante.
- **Drible**: toques orientados, skill moves de risco/retorno e janela de contato.
- **Marcação manual**: contenção, bote, cobertura de linha de passe.

## 5.3 Responsividade
- Input buffer de 80–120ms para consistência.
- Janela de cancel limitada para evitar “teletransporte animado”.
- Priorização de comandos críticos (passe/chute) sobre microajustes de locomoção.

---

## 6) Sistema de IA Tática

## 6.1 Modelo híbrido
- **Camada macro (Team AI)**: formação, compactação, largura, linha defensiva, gatilhos de pressão.
- **Camada micro (Role AI)**: decisões por função (lateral, volante, meia etc.).
- **Utility AI / score-based decisions**: escolhe ação por contexto (risco, vantagem espacial, tempo de jogo).

## 6.2 Estilos de jogo por time
- Contra-ataque vertical.
- Posse de bola paciente.
- Exploração de laterais e cruzamentos.
- Bloco baixo com transição rápida.

Cada estilo ajusta parâmetros em tempo real:
- distância entre linhas;
- frequência de pressão;
- agressividade de passes;
- sobreposição de laterais;
- ritmo de circulação da bola.

## 6.3 IA de goleiro
- Predição balística de chute/cruzamento.
- Biblioteca de defesas por contexto (reflexo, queda, soco, encaixe).
- Decisão de saída (x1, bola aérea, cobertura de profundidade).

---

## 7) Sistema de Física da Bola

## Objetivo
Bola com comportamento natural, legível e “ensinável” ao jogador competitivo.

## Componentes
- Modelo de força/torque por contato (pé, cabeça, peito, gramado).
- Spin (topspin, backspin, sidespin) afetando trajetória e quique.
- Atrito variável por clima/gramado.
- Colisões com prioridade em estabilidade numérica.

## Abordagem prática
- Base em Chaos com camada customizada para parâmetros de futebol.
- Tick substepping dedicado à bola para evitar inconsistências em FPS variável.
- Testes determinísticos para validar trajetórias padrão (passe, chute, cruzamento).

---

## 8) Sistema de Animações

## Pipeline
- Captura de movimento + animações autorais para ações-chave.
- State machines para estados canônicos.
- Motion matching para transições orgânicas de corrida/giro/desaceleração.
- IK de membros inferiores para contato pé-bola e adaptação ao solo.

## Regras de qualidade
- Tempo de resposta do input deve prevalecer sobre fidelidade visual extrema.
- Evitar “sliding” com correção de root motion orientada a gameplay.
- Biblioteca específica para disputas físicas e proteção de bola.

---

## 9) Sistema de Câmera de Jogo

### Câmeras principais
1. **Broadcast dinâmica** (padrão competitivo).
2. **Tática ampla** (leitura estratégica).
3. **Player-focused** (modo carreira jogador).
4. **Replay cinematográfico** com keyframes automáticos.

### Regras
- Preservar visibilidade de linhas de passe e profundidade.
- Zoom adaptativo por zona e velocidade de transição.
- Anti-motion-sickness em mudanças bruscas.

---

## 10) Modos de Jogo e Progressão

## 10.1 Partida rápida
- Entrada imediata com presets de dificuldade e assistência.

## 10.2 Liga Master (inspirada no clássico)
- Gestão de elenco, orçamento, staff técnico, metas de diretoria.
- Sistema de moral, fadiga acumulada e química tática.
- Desenvolvimento de jovens e scouting regional.

## 10.3 Copa e Liga
- Estrutura modular de regulamentos e calendários.
- Critérios de desempate configuráveis.

## 10.4 Carreira de jogador
- Evolução por desempenho em campo e treino.
- Personalidade influencia decisões de técnico, mídia e contrato.

## 10.5 Squad Builder (estilo myClub sem monetização agressiva)
- Montagem de elenco por objetivos e progressão justa.
- Economia baseada em gameplay, temporada e eventos competitivos.

---

## 11) Sistema de Fadiga e Emoção

- **Fadiga física**: sprint, carga de contato, tempo sem recuperação.
- **Estado emocional**: confiança, pressão do placar, momentum psicológico.
- Impactos:
  - precisão de passe/chute;
  - velocidade de reação;
  - qualidade de decisão da IA;
  - risco de erro técnico.

Modelo transparente para o jogador (feedback no HUD e pós-jogo).

---

## 12) Save System Robusto

- Save local versionado + cloud sync opcional.
- Event sourcing simplificado para modos longos (Master/Carreira).
- Migração de versão automática com fallback.
- Integridade por checksum e recovery point.

---

## 13) Suporte a Mods (futuro)

- Pacotes de dados assinados (`.pak` + manifesto).
- APIs controladas para:
  - elencos e atributos;
  - uniformes, emblemas e competições;
  - overlays UI e áudio.
- Sandbox para impedir código arbitrário malicioso.

---

## 14) Roadmap de Desenvolvimento por Fases

### Fase 0 — Pré-produção (8–12 semanas)
- GDD e TDD finalizados.
- Vertical Slice de jogabilidade (1 estádio, 2 times, 5 min).
- Definição de KPIs de sensação de jogo (latência, controle, física).

### Fase 1 — Fundação jogável (4–6 meses)
- Loop completo de partida 11v11.
- Sistemas base: passe/chute/drible/marcação/goleiro.
- IA tática inicial + 3 estilos de jogo.
- HUD mínimo + replay básico.

### Fase 2 — Conteúdo competitivo (4–6 meses)
- Balanceamento avançado.
- Quick Match, Liga e Copa completos.
- Multiplayer local + online estável.
- Ferramentas de telemetria para tuning de gameplay.

### Fase 3 — Modos profundos (6–9 meses)
- Master League completa.
- Carreira de jogador.
- Squad Builder sem monetização agressiva.
- Editores de time/jogador/uniforme/emblema.

### Fase 4 — Polimento AAA (4–6 meses)
- Animação avançada e refinamento de câmera.
- Replays cinematográficos.
- Otimização multi-plataforma.
- Testes de larga escala no online.

### Fase 5 — Live Ops e Expansões (contínuo)
- Temporadas de conteúdo.
- Eventos competitivos.
- APIs para mods de dados.

---

## 15) Metas Técnicas de Qualidade (KPIs)

- Input-to-action mediano < 120ms (offline).
- 60 FPS estáveis em partidas completas.
- Erro de sincronização online abaixo de limite competitivo definido por região.
- Taxa de crash por sessão abaixo da meta de lançamento.
- Retenção por modo e engajamento por temporada monitorados continuamente.

---

## 16) Time Recomendado (núcleo)

- Direção de jogo e direção técnica.
- Engenharia de gameplay, IA, rede, backend e ferramentas.
- Animação técnica + design de movimento.
- Design de jogo (core + modos).
- UI/UX, áudio, QA funcional e QA de balanceamento.
- DevOps/SRE + dados/telemetria.

---

## 17) Próximos Passos Imediatos

1. Aprovar stack final (UE5 + backend).
2. Definir “golden gameplay metrics”.
3. Implementar vertical slice com foco em:
   - passe/chute/drible/marcação manual;
   - IA tática base;
   - física da bola e sensação de controle.
4. Rodar playtests semanais orientados por telemetria e feedback estruturado.
5. Congelar fundações antes de expandir conteúdo.

---

Se quiser, no próximo passo eu já transformo este plano em:
- **Backlog técnico completo (épicos → features → tasks)**,
- **Matriz de riscos**,
- **Plano de milestones com critérios de aceite por fase**,
- **Especificação inicial de classes/módulos UE5**.
