/**
 * Gun Game Ultra - Free-for-all con progresión de loadouts aleatorios.
 * Versión 2.0.0 - script principal unificado.
 *
 * Resumen:
 * - Cada jugador tiene una secuencia aleatoria de "loadouts" (armas/gadgets).
 * - Ganas subiendo de tier en cada kill hasta llegar al loadout final (cuchillo).
 * - Rachas (streaks) otorgan temporalmente un loadout épico.
 * - Anti-camping, HUD con progreso, y marcador de líder.
 *
 * Notas para Portal:
 * - No se requieren dependencias externas. El archivo funciona con el SDK PortaI BF.
 * - Evitamos usar APIs no soportadas en Portal (solo funciones de mod/Portal SDK).
 * - Si el validador de Portal reporta errores, revisa la sección "Errores comunes" del README.
 */

/// <reference path="../../code/mod/index.d.ts" />
import * as modlib from '../../code/modlib/index.js';

type PlayerId = number;

type Vector3 = { x: number; y: number; z: number };

type Loadout = {
    id: string;
    name: string;
    primary?: mod.Weapons;
    secondary?: mod.Weapons;
    gadgetOne?: mod.Gadgets;
    gadgetTwo?: mod.Gadgets;
    throwable?: mod.Gadgets;
    melee?: mod.Gadgets;
};


// Estado de jugador gestionado por el modo. No se serializa; se crea al unirse al match.
type PlayerState = {
    id: PlayerId;
    player: mod.Player;
    name: string;
    sequence: Loadout[];
    tierIndex: number;
    kills: number;
    streak: number;
    lastUpgradeAt?: number;
    epicUntil?: number;
    epicLoadout?: Loadout;
    stillSince?: number;
    lastPos?: Vector3;
    isLeader?: boolean;
    pendingLoadout?: Loadout;
};

// Pool de loadouts disponibles. La secuencia de cada jugador se genera a partir de este pool.
const LOADOUT_POOL: Loadout[] = [
    {
        id: 'ar-m433',
        name: 'M433 y M45A1',
        primary: mod.Weapons.AssaultRifle_M433,
        secondary: mod.Weapons.Sidearm_M45A1,
        gadgetOne: mod.Gadgets.Class_Adrenaline_Injector,
        gadgetTwo: mod.Gadgets.Misc_Supply_Pouch,
        throwable: mod.Gadgets.Throwable_Fragmentation_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'smg-umg40',
        name: 'UMG-40 y ES-57',
        primary: mod.Weapons.SMG_UMG_40,
        secondary: mod.Weapons.Sidearm_ES_57,
        gadgetOne: mod.Gadgets.Misc_Tripwire_Sensor_AV_Mine,
        gadgetTwo: mod.Gadgets.Class_Repair_Tool,
        throwable: mod.Gadgets.Throwable_Smoke_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'shotgun-m1014',
        name: 'M1014 Escopeta',
        primary: mod.Weapons.Shotgun_M1014,
        secondary: mod.Weapons.Sidearm_M44,
        gadgetOne: mod.Gadgets.Misc_Demolition_Charge,
        throwable: mod.Gadgets.Throwable_Incendiary_Grenade,
        melee: mod.Gadgets.Melee_Hunting_Knife
    },
    {
        id: 'dmr-svdm',
        name: 'SVDM DMR',
        primary: mod.Weapons.DMR_SVDM,
        secondary: mod.Weapons.Sidearm_P18,
        gadgetOne: mod.Gadgets.Class_Motion_Sensor,
        gadgetTwo: mod.Gadgets.Misc_Sniper_Decoy,
        throwable: mod.Gadgets.Throwable_Proximity_Detector,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'lmg-m250',
        name: 'M250 LMG',
        primary: mod.Weapons.LMG_M250,
        secondary: mod.Weapons.Sidearm_M45A1,
        gadgetOne: mod.Gadgets.Deployable_Cover,
        gadgetTwo: mod.Gadgets.Misc_Supply_Pouch,
        throwable: mod.Gadgets.Throwable_Mini_Frag_Grenade,
        melee: mod.Gadgets.Melee_Sledgehammer
    },
    {
        id: 'sniper-psr',
        name: 'PSR Francotirador',
        primary: mod.Weapons.Sniper_PSR,
        secondary: mod.Weapons.Sidearm_ES_57,
        gadgetOne: mod.Gadgets.Class_Motion_Sensor,
        gadgetTwo: mod.Gadgets.Misc_Laser_Designator,
        throwable: mod.Gadgets.Throwable_Smoke_Grenade,
        melee: mod.Gadgets.Melee_Hunting_Knife
    },
    {
        id: 'smg-scw10',
        name: 'SCW-10 SMG',
        primary: mod.Weapons.SMG_SCW_10,
        secondary: mod.Weapons.Sidearm_M45A1,
        gadgetOne: mod.Gadgets.Misc_Anti_Personnel_Mine,
        gadgetTwo: mod.Gadgets.Class_Adrenaline_Injector,
        throwable: mod.Gadgets.Throwable_Flash_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'ar-kord',
        name: 'Kord 6P67',
        primary: mod.Weapons.AssaultRifle_KORD_6P67,
        secondary: mod.Weapons.Sidearm_M44,
        gadgetOne: mod.Gadgets.Deployable_Missile_Intercept_System,
        throwable: mod.Gadgets.Throwable_Throwing_Knife,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'carbine-m4a1',
        name: 'M4A1 Carabina',
        primary: mod.Weapons.Carbine_M4A1,
        secondary: mod.Weapons.Sidearm_P18,
        gadgetOne: mod.Gadgets.Class_Supply_Bag,
        gadgetTwo: mod.Gadgets.Launcher_Smoke_Grenade,
        throwable: mod.Gadgets.Throwable_Smoke_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'ar-l85a3',
        name: 'L85A3 Asalto',
        primary: mod.Weapons.AssaultRifle_L85A3,
        secondary: mod.Weapons.Sidearm_ES_57,
        gadgetOne: mod.Gadgets.Misc_Defibrillator,
        gadgetTwo: mod.Gadgets.Class_Adrenaline_Injector,
        throwable: mod.Gadgets.Throwable_Fragmentation_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'lmg-drsiar',
        name: 'DRS IAR',
        primary: mod.Weapons.LMG_DRS_IAR,
        secondary: mod.Weapons.Sidearm_M45A1,
        gadgetOne: mod.Gadgets.Deployable_Vehicle_Supply_Crate,
        gadgetTwo: mod.Gadgets.Class_Repair_Tool,
        throwable: mod.Gadgets.Throwable_Incendiary_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'shotgun-185ks',
        name: '185KS Escopeta',
        primary: mod.Weapons.Shotgun__185KS_K,
        secondary: mod.Weapons.Sidearm_M45A1,
        gadgetOne: mod.Gadgets.Launcher_Aim_Guided,
        throwable: mod.Gadgets.Throwable_Stun_Grenade,
        melee: mod.Gadgets.Melee_Hunting_Knife
    },
    {
        id: 'smg-umg90',
        name: 'USG-90 SMG',
        primary: mod.Weapons.SMG_USG_90,
        secondary: mod.Weapons.Sidearm_ES_57,
        gadgetOne: mod.Gadgets.Misc_Tracer_Dart,
        gadgetTwo: mod.Gadgets.Deployable_Recon_Drone,
        throwable: mod.Gadgets.Throwable_Flash_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'dmr-lmr27',
        name: 'LMR-27 DMR',
        primary: mod.Weapons.DMR_LMR27,
        secondary: mod.Weapons.Sidearm_M44,
        gadgetOne: mod.Gadgets.Misc_Sniper_Decoy,
        throwable: mod.Gadgets.Throwable_Proximity_Detector,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'carbine-qbz',
        name: 'QBZ-192 Carabina',
        primary: mod.Weapons.Carbine_QBZ_192,
        secondary: mod.Weapons.Sidearm_P18,
        gadgetOne: mod.Gadgets.Misc_Tripwire_Sensor_AV_Mine,
        gadgetTwo: mod.Gadgets.Class_Supply_Bag,
        throwable: mod.Gadgets.Throwable_Fragmentation_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    },
    {
        id: 'sniper-m2010',
        name: 'M2010 ESR',
        primary: mod.Weapons.Sniper_M2010_ESR,
        secondary: mod.Weapons.Sidearm_M45A1,
        gadgetOne: mod.Gadgets.Class_Motion_Sensor,
        gadgetTwo: mod.Gadgets.Misc_Laser_Designator,
        throwable: mod.Gadgets.Throwable_Smoke_Grenade,
        melee: mod.Gadgets.Melee_Hunting_Knife
    },
    {
        id: 'ar-tr7',
        name: 'TR-7 Asalto',
        primary: mod.Weapons.AssaultRifle_TR_7,
        secondary: mod.Weapons.Sidearm_ES_57,
        gadgetOne: mod.Gadgets.Misc_Supply_Pouch,
        gadgetTwo: mod.Gadgets.Class_Adrenaline_Injector,
        throwable: mod.Gadgets.Throwable_Fragmentation_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    }
];

// Loadouts entregados temporalmente al alcanzar cierta racha de kills.
const EPIC_LOADOUTS: Loadout[] = [
    {
        id: 'epic-minigun',
        name: 'LMG Pesada',
        primary: mod.Weapons.LMG_M250,
        secondary: mod.Weapons.Sidearm_M45A1,
        gadgetOne: mod.Gadgets.Class_Adrenaline_Injector,
        throwable: mod.Gadgets.Throwable_Incendiary_Grenade,
        melee: mod.Gadgets.Melee_Sledgehammer
    },
    {
        id: 'epic-rocket',
        name: 'Launcher AT',
        primary: mod.Weapons.AssaultRifle_NVO_228E,
        secondary: mod.Weapons.Sidearm_ES_57,
        gadgetOne: mod.Gadgets.Launcher_Unguided_Rocket,
        throwable: mod.Gadgets.Throwable_Anti_Vehicle_Grenade,
        melee: mod.Gadgets.Melee_Hunting_Knife
    },
    {
        id: 'epic-specialist',
        name: 'Kit Especialista',
        primary: mod.Weapons.SMG_PW7A2,
        secondary: mod.Weapons.Sidearm_M44,
        gadgetOne: mod.Gadgets.Deployable_Portable_Mortar,
        gadgetTwo: mod.Gadgets.Misc_Assault_Ladder,
        throwable: mod.Gadgets.Throwable_Flash_Grenade,
        melee: mod.Gadgets.Melee_Combat_Knife
    }
];

// Último loadout. Al alcanzarlo se considera "último paso" hacia la victoria.
const FINAL_LOADOUT: Loadout = {
    id: 'final',
    name: 'Cuchillo Dorado',
    melee: mod.Gadgets.Melee_Hunting_Knife,
    throwable: mod.Gadgets.Throwable_Throwing_Knife
};

// Textos usados para notificaciones HUD. Se usa con format("{}", ...args).
const TEXT = {
    welcome: '¡Bienvenido a Gun Game Ultra Aleatorio! 🎲',
    progress: 'Progreso Aleatorio: {}/{}',
    streak: 'Racha: {}',
    epicKit: '¡KIT ÉPICO ALEATORIO!',
    levelUp: '¡Subiste de nivel! Kit aleatorio: {}',
    finalKit: '¡{} tiene el kit final! ¡Una kill más para ganar!',
    victory: '¡¡¡{} GANA GUN GAME ULTRA ALEATORIO!!!',
    downgrade: '¡Te han degradado! Perdiste un nivel aleatorio.',
    epicExpired: 'Tu kit épico aleatorio ha expirado.',
    camping: '¡Deja de moverte tan poco! Mantente activo.',
    campingReveal: '¡{} está acampando en [{}, {}]!',
    newLeader: '¡{} toma el liderazgo con su secuencia aleatoria!',
    streakAnnounce: '¡{} tiene una racha de {}!',
    epicByStreak: '¡{} consigue un kit épico aleatorio por racha de {}!',
    gameStart: '¡GUN GAME ULTRA ALEATORIO ha comenzado! 🎲',
    gameInstructions: '¡Progresa por {} kits aleatorios únicos para ganar!',
    gameEnd: '¡Gracias por jugar Gun Game Ultra Aleatorio!',
    killsToWin: '¡Consigue {} kills con kits completamente aleatorios para ganar!',
    randomSequence: 'Tu secuencia de armas es única y aleatoria',
    unpredictable: '¡Cada partida es completamente diferente!'
} as const;

// Parámetros de juego.
const TIERS_COUNT = 17;
const FINAL_INDEX = TIERS_COUNT - 1;
const STREAK_FOR_EPIC = 3;
const EPIC_DURATION = 8; // segundos
const DOWNGRADE_WINDOW = 3; // segundos
const CAMP_MAX_STILL = 20; // segundos
const CAMP_MOVE_EPS = 2.0;
const HUD_REFRESH_INTERVAL = 1; // segundos

// Estado global del modo.
const players = new Map<PlayerId, PlayerState>();
let gameStarted = false;
let leaderPlayerId: PlayerId | null = null;
let lastHudUpdate = 0;

// Tiempo en milisegundos transcurrido en el match.
function now(): number {
    return mod.GetMatchTimeElapsed();
}

// Helpers para aleatoriedad.
function randChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function format(text: string, ...args: Array<string | number>): string {
    let formatted = text;
    for (const arg of args) {
        formatted = formatted.replace("{}", String(arg));
    }
    return formatted;
}

// Obtiene o crea el estado de un jugador.
function getPlayerId(player: mod.Player): PlayerId {
    return mod.GetObjId(player);
}

function getPlayerState(player: mod.Player): PlayerState | undefined {
    return players.get(getPlayerId(player));
}

function ensurePlayerState(player: mod.Player): PlayerState {
    const id = getPlayerId(player);
    let state = players.get(id);
    if (state) {
        state.player = player;
        return state;
    }

    state = {
        id,
        player,
        name: `Jugador-${id}`,
        sequence: generateSequence(),
        tierIndex: 0,
        kills: 0,
        streak: 0
    };
    players.set(id, state);
    return state;
}

// Genera una secuencia de loadouts con el final fijo al cuchillo.
function generateSequence(): Loadout[] {
    const picks = shuffle(LOADOUT_POOL);
    const sequence = picks.slice(0, TIERS_COUNT - 1);
    sequence.push(FINAL_LOADOUT);
    return sequence;
}

// Devuelve el loadout activo (épico temporal o el de su tier actual).
function activeLoadoutFor(state: PlayerState): Loadout {
    return state.epicLoadout ?? state.sequence[state.tierIndex];
}

// Comprueba si el soldado del jugador está vivo sin lanzar excepción.
function isAlive(player: mod.Player): boolean {
    try {
        return Boolean(mod.GetSoldierState(player, mod.SoldierStateBool.IsAlive));
    } catch {
        return false;
    }
}

// Limpia inventario del jugador (si el slot existe y está activo).
function clearEquipment(player: mod.Player): void {
    const slots = [
        mod.InventorySlots.PrimaryWeapon,
        mod.InventorySlots.SecondaryWeapon,
        mod.InventorySlots.GadgetOne,
        mod.InventorySlots.GadgetTwo,
        mod.InventorySlots.Throwable,
        mod.InventorySlots.MeleeWeapon,
        mod.InventorySlots.ClassGadget,
        mod.InventorySlots.MiscGadget
    ];
    for (const slot of slots) {
        try {
            if (mod.IsInventorySlotActive(player, slot)) {
                mod.RemoveEquipment(player, slot);
            }
        } catch {
            // Slot puede no estar disponible; ignorar.
        }
    }
}

// Repone munición para evitar quedarse sin balas entre cambios de loadout.
function replenishAmmo(player: mod.Player, loadout: Loadout): void {
    try {
        if (loadout.primary !== undefined && mod.IsInventorySlotActive(player, mod.InventorySlots.PrimaryWeapon)) {
            mod.SetInventoryAmmo(player, mod.InventorySlots.PrimaryWeapon, 180);
            mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.PrimaryWeapon, 60);
        }
    } catch { /* noop */ }

    try {
        if (loadout.secondary !== undefined && mod.IsInventorySlotActive(player, mod.InventorySlots.SecondaryWeapon)) {
            mod.SetInventoryAmmo(player, mod.InventorySlots.SecondaryWeapon, 90);
            mod.SetInventoryMagazineAmmo(player, mod.InventorySlots.SecondaryWeapon, 45);
        }
    } catch { /* noop */ }

    try {
        if (loadout.throwable !== undefined && mod.IsInventorySlotActive(player, mod.InventorySlots.Throwable)) {
            mod.SetInventoryAmmo(player, mod.InventorySlots.Throwable, 3);
        }
    } catch { /* noop */ }
}

/**
 * Equipa un loadout en el jugador.
 * - Si el jugador no está listo (no válido/no vivo), lo marca como pendiente para reintentar.
 * - notify/message: muestra un mensaje al jugador tras equipar.
 */
function equipLoadout(state: PlayerState, loadout: Loadout, notify = false, message?: string): void {
    const player = state.player;
    if (!mod.IsPlayerValid(player)) {
        state.pendingLoadout = loadout;
        return;
    }

    if (!isAlive(player)) {
        state.pendingLoadout = loadout;
        return;
    }

    try {
        clearEquipment(player);

        if (loadout.primary !== undefined) {
            mod.AddEquipment(player, loadout.primary);
        }
        if (loadout.secondary !== undefined) {
            mod.AddEquipment(player, loadout.secondary);
        }
        if (loadout.gadgetOne !== undefined) {
            mod.AddEquipment(player, loadout.gadgetOne);
        }
        if (loadout.gadgetTwo !== undefined) {
            mod.AddEquipment(player, loadout.gadgetTwo);
        }
        if (loadout.throwable !== undefined) {
            mod.AddEquipment(player, loadout.throwable);
        }
        if (loadout.melee !== undefined) {
            mod.AddEquipment(player, loadout.melee);
        } else {
            mod.AddEquipment(player, mod.Gadgets.Melee_Combat_Knife);
        }

        replenishAmmo(player, loadout);
        state.pendingLoadout = undefined;

        if (notify && message) {
            displayMessageToPlayer(player, message);
        }
    } catch (e) {
        console.warn('Error equipando loadout:', e);
        state.pendingLoadout = loadout;
    }
}

// Si había un loadout pendiente (p.ej. por muerte), vuelve a intentar equiparlo.
function restorePendingLoadout(state: PlayerState): void {
    if (!state.pendingLoadout) return;
    equipLoadout(state, state.pendingLoadout);
}

// Baja un tier tras morir justo después de subir (ventana DOWNGRADE_WINDOW).
function downgradePlayer(state: PlayerState): void {
    if (state.tierIndex === 0) return;
    state.tierIndex--;
    const loadout = state.sequence[state.tierIndex];
    state.epicUntil = undefined;
    state.epicLoadout = undefined;
    state.pendingLoadout = loadout;
    equipLoadout(state, loadout, true, TEXT.downgrade);
    updateLeader();
}

// Sube un tier y gestiona anuncio de arma final.
function upgradePlayer(state: PlayerState): void {
    if (state.tierIndex >= FINAL_INDEX) return;
    state.tierIndex++;
    state.lastUpgradeAt = now();
    const loadout = state.sequence[state.tierIndex];
    state.epicUntil = undefined;
    state.epicLoadout = undefined;

    if (state.tierIndex === FINAL_INDEX) {
        equipLoadout(state, loadout, true, format(TEXT.finalKit, state.name));
        displayMessageToAll(format(TEXT.finalKit, state.name));
    } else {
        equipLoadout(state, loadout, true, format(TEXT.levelUp, loadout.name));
    }

    updateLeader();
}

// Entrega un loadout épico temporal por racha.
function giveEpicLoadout(state: PlayerState): void {
    const loadout = randChoice(EPIC_LOADOUTS);
    state.epicLoadout = loadout;
    state.epicUntil = now() + EPIC_DURATION;
    equipLoadout(state, loadout, true, TEXT.epicKit);
}

// Restaura el loadout normal del jugador.
function restoreNormalLoadout(state: PlayerState, notify = true): void {
    state.epicLoadout = undefined;
    state.epicUntil = undefined;
    const loadout = state.sequence[state.tierIndex];
    equipLoadout(state, loadout, notify, notify ? format(TEXT.levelUp, loadout.name) : undefined);
}

// Envoltorios de mensajería seguros para Portal (capturan errores del SDK).
function displayMessageToPlayer(player: mod.Player, text: string): void {
    try {
        const msg = mod.Message(text);
        mod.DisplayNotificationMessage(msg, player);
    } catch (e) {
        console.warn('Error enviando mensaje a jugador:', e);
    }
}

function displayMessageToAll(text: string): void {
    try {
        const msg = mod.Message(text);
        mod.DisplayNotificationMessage(msg);
    } catch (e) {
        console.warn('Error enviando mensaje global:', e);
    }
}

// Obtiene la posición actual del jugador.
function getCurrentPosition(player: mod.Player): Vector3 | null {
    try {
        const pos = mod.GetSoldierState(player, mod.SoldierStateVector.GetPosition);
        return {
            x: mod.XComponentOf(pos),
            y: mod.YComponentOf(pos),
            z: mod.ZComponentOf(pos)
        };
    } catch {
        return null;
    }
}

// Calcula el líder actual (mayor tier) y anuncia cambios.
function updateLeader(): void {
    let newLeader: PlayerState | null = null;
    let maxTier = -1;
    const allStates = Array.from(players.values());
    for (const state of allStates) {
        if (state.tierIndex > maxTier) {
            maxTier = state.tierIndex;
            newLeader = state;
        }
    }

    if (newLeader && newLeader.id !== leaderPlayerId) {
        leaderPlayerId = newLeader.id;
        newLeader.isLeader = true;
        displayMessageToAll(format(TEXT.newLeader, newLeader.name));
    }
}

// Penaliza el no movimiento prolongado.
function updateAntiCamping(state: PlayerState): void {
    const player = state.player;
    if (!isAlive(player)) {
        state.lastPos = undefined;
        state.stillSince = undefined;
        return;
    }

    const pos = getCurrentPosition(player);
    if (!pos) return;

    const currentTime = now();
    if (state.lastPos) {
        const dx = pos.x - state.lastPos.x;
        const dy = pos.y - state.lastPos.y;
        const dz = pos.z - state.lastPos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CAMP_MOVE_EPS) {
            if (state.stillSince === undefined) {
                state.stillSince = currentTime;
            } else if (currentTime - state.stillSince >= CAMP_MAX_STILL) {
                displayMessageToPlayer(player, TEXT.camping);
                displayMessageToAll(format(TEXT.campingReveal, state.name, Math.round(pos.x), Math.round(pos.z)));
                state.stillSince = currentTime;
            }
        } else {
            state.stillSince = undefined;
        }
    }

    state.lastPos = pos;
}

// Muestra HUD con progreso/racha con una cadencia controlada.
function updateHUDs(): void {
    const current = now();
    if (current - lastHudUpdate < HUD_REFRESH_INTERVAL) return;
    lastHudUpdate = current;

    players.forEach((state) => {
        const progressText = format(TEXT.progress, state.tierIndex + 1, TIERS_COUNT);
        const streakText = format(TEXT.streak, state.streak);
        displayMessageToPlayer(state.player, `${progressText} • ${streakText}`);
    });
}

// Revisa expiración de loadouts épicos.
function processEpicTimers(): void {
    const current = now();
    players.forEach((state) => {
        if (state.epicUntil && current >= state.epicUntil) {
            restoreNormalLoadout(state, true);
            displayMessageToPlayer(state.player, TEXT.epicExpired);
        }
    });
}

// Eventos principales de Portal.
export function OnPlayerJoinGame(eventPlayer: mod.Player): void {
    const state = ensurePlayerState(eventPlayer);
    displayMessageToPlayer(eventPlayer, TEXT.welcome);
    displayMessageToPlayer(eventPlayer, format(TEXT.killsToWin, TIERS_COUNT));
    state.pendingLoadout = state.sequence[state.tierIndex];
}

export function OnPlayerLeaveGame(eventNumber: number): void {
    const state = players.get(eventNumber);
    if (!state) return;
    players.delete(eventNumber);
    if (leaderPlayerId === eventNumber) {
        leaderPlayerId = null;
        updateLeader();
    }
}

export function OnPlayerDeployed(eventPlayer: mod.Player): void {
    const state = ensurePlayerState(eventPlayer);
    const loadout = activeLoadoutFor(state);
    equipLoadout(state, loadout, false);
    restorePendingLoadout(state);
}

export function OnPlayerEarnedKill(
    eventPlayer: mod.Player,
    eventOtherPlayer: mod.Player,
    _eventDeathType: mod.DeathType,
    _eventWeaponUnlock: mod.WeaponUnlock
): void {
    const killerState = getPlayerState(eventPlayer);
    const victimState = getPlayerState(eventOtherPlayer);
    if (!killerState || !victimState) return;

    killerState.kills++;
    killerState.streak++;
    victimState.streak = 0;

    if (victimState.lastUpgradeAt && now() - victimState.lastUpgradeAt <= DOWNGRADE_WINDOW) {
        downgradePlayer(victimState);
    }

    if (killerState.epicUntil && now() >= killerState.epicUntil) {
        restoreNormalLoadout(killerState, false);
    }

    if (killerState.streak >= STREAK_FOR_EPIC && !killerState.epicLoadout) {
        giveEpicLoadout(killerState);
        displayMessageToAll(format(TEXT.epicByStreak, killerState.name, killerState.streak));
    }

    if (killerState.tierIndex < FINAL_INDEX) {
        upgradePlayer(killerState);
    } else {
        displayMessageToAll(format(TEXT.victory, killerState.name));
        mod.EndGameMode(eventPlayer);
    }

    if (killerState.streak >= 5) {
        displayMessageToAll(format(TEXT.streakAnnounce, killerState.name, killerState.streak));
    }
}

export function OnPlayerDied(
    eventPlayer: mod.Player,
    _eventOtherPlayer: mod.Player,
    _eventDeathType: mod.DeathType,
    _eventWeaponUnlock: mod.WeaponUnlock
): void {
    const state = getPlayerState(eventPlayer);
    if (!state) return;
    state.streak = 0;

    if (state.epicLoadout) {
        state.epicLoadout = undefined;
        state.epicUntil = undefined;
    }

    state.pendingLoadout = state.sequence[state.tierIndex];
}

export async function OnGameModeStarted(): Promise<void> {
    gameStarted = true;
    leaderPlayerId = null;
    lastHudUpdate = 0;

    mod.SetSpawnMode(mod.SpawnModes.AutoSpawn);

    displayMessageToAll(TEXT.gameStart);
    displayMessageToAll(format(TEXT.gameInstructions, TIERS_COUNT));

    const allPlayers = modlib.ConvertArray(mod.AllPlayers());
    for (const player of allPlayers) {
        const state = ensurePlayerState(player);
        equipLoadout(state, state.sequence[state.tierIndex], false);
    }

    while (gameStarted) {
        await mod.Wait(1);
        processEpicTimers();
        updateHUDs();

        players.forEach((state) => {
            updateAntiCamping(state);
        });
    }
}

export function OnGameModeEnding(): void {
    gameStarted = false;
    players.clear();
    leaderPlayerId = null;
    displayMessageToAll(TEXT.gameEnd);
}

export function OngoingGlobal(): void {
    // Lógica continua adicional no requerida; el bucle principal cubre las verificaciones.
}
