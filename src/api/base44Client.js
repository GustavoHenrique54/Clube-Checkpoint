// Local Storage-backed base44 mock client for 100% offline usage.
// Populated with imported data from Base44 exports.

// Database version migration check to clear out old dummy values
const DB_VERSION = "v3_imported_real";
if (typeof window !== 'undefined' && localStorage.getItem("ckpnt_db_version") !== DB_VERSION) {
  const keysToClear = ["Badge", "PublicProfile", "ClubHub", "ClubNews", "ClubLink", "UserBadge", "FriendRequest", "LandingConfig", "session"];
  for (const k of keysToClear) {
    localStorage.removeItem(`ckpnt_db_${k}`);
  }
  localStorage.removeItem("ckpnt_session");
  localStorage.setItem("ckpnt_db_version", DB_VERSION);
  console.log("Database updated to real imported version. Cleared old local storage cache.");
}

class LocalEntity {
  constructor(name, defaultData = []) {
    this.name = name;
    this.key = `ckpnt_db_${name}`;
    if (!localStorage.getItem(this.key)) {
      localStorage.setItem(this.key, JSON.stringify(defaultData));
    }
  }

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || "[]");
    } catch (e) {
      console.error(`Error reading entity ${this.name} from local storage:`, e);
      return [];
    }
  }

  saveAll(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  async list(orderBy = "", limit = 100) {
    let items = this.getAll();
    if (orderBy) {
      const desc = orderBy.startsWith("-");
      const field = desc ? orderBy.slice(1) : orderBy;
      items.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        if (field === 'created_date' || field === 'created_at') {
          valA = new Date(valA || 0);
          valB = new Date(valB || 0);
        }
        if (valA < valB) return desc ? 1 : -1;
        if (valA > valB) return desc ? -1 : 1;
        return 0;
      });
    }
    return items.slice(0, limit);
  }

  async filter(criteria = {}) {
    let items = this.getAll();
    return items.filter(item => {
      for (const [key, value] of Object.entries(criteria)) {
        if (item[key] !== value) return false;
      }
      return true;
    });
  }

  async get(id) {
    let items = this.getAll();
    return items.find(item => item.id === id) || null;
  }

  async create(data) {
    let items = this.getAll();
    const newItem = {
      id: Math.random().toString(36).substring(2, 11),
      created_date: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    this.saveAll(items);
    return newItem;
  }

  async update(id, data) {
    let items = this.getAll();
    let updated = null;
    items = items.map(item => {
      if (item.id === id) {
        updated = { ...item, ...data };
        return updated;
      }
      return item;
    });
    this.saveAll(items);
    return updated;
  }

  async delete(id) {
    let items = this.getAll();
    items = items.filter(item => item.id !== id);
    this.saveAll(items);
    return { success: true };
  }
}

// 1. Exported Badges
const defaultBadges = [
  {
    "name": "FEZ PARTE DO CHECKPOINT #3",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/3042e4189_lanterna.png",
    "description": "Participou da nossa reunião sobre Alan Wake!",
    "category": "participation",
    "is_secret": false,
    "rarity": "rare",
    "id": "6a0e8e1acb0ad7b3573aad05",
    "created_date": "2026-05-21T04:46:18.527000",
    "updated_date": "2026-05-21T04:46:47.456000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "ESCRITOR BEST-SELLER",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/8ffa83de1_Alanwake.png",
    "description": "Concluiu Alan Wake junto com o Clube Checkpoint",
    "category": "participation",
    "is_secret": false,
    "rarity": "rare",
    "id": "6a0e8de5413c0c132849ec93",
    "created_date": "2026-05-21T04:45:25.414000",
    "updated_date": "2026-05-21T04:45:48.070000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "PILAR DA COMUNIDADE",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/94b21fc5a_Amigo.png",
    "description": "Trouxe um amigo ao Clube Checkpoint! Obrigado, vamos juntos tornar o mundo dos jogos uma experiência inesquecível!",
    "category": "special",
    "is_secret": false,
    "rarity": "legendary",
    "id": "6a0e8d658609debd2366d2f3",
    "created_date": "2026-05-21T04:43:17.022000",
    "updated_date": "2026-05-21T04:43:17.022000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "VAI UM CAFÉZINHO?",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/818452998_Caneca.png",
    "description": "Coletou todas as garrafas de café em Alan Wake!",
    "category": "participation",
    "is_secret": false,
    "rarity": "epic",
    "id": "6a0e8cdc4c60b9d500f6214a",
    "created_date": "2026-05-21T04:41:00.983000",
    "updated_date": "2026-05-21T04:41:00.983000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "QUEBROU A MALDIÇÃO",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/318364f04_OoT_Token_Model.webp",
    "description": "Coletou todas as 100 Gold Skulltulas em The Legend of Zelda: Ocarina of Time! UAU!",
    "category": "participation",
    "is_secret": false,
    "rarity": "epic",
    "id": "6a0b64d3414069dbb3ddbe9b",
    "created_date": "2026-05-18T19:13:23.822000",
    "updated_date": "2026-05-18T19:13:23.822000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "A ESPADA LENDÁRIA!",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/ab70434ae_mastersword3.png",
    "description": "Desbloqueou a Master Sword!",
    "category": "special",
    "is_secret": false,
    "rarity": "rare",
    "id": "69fc93e15ec7880c9a989167",
    "created_date": "2026-05-07T13:30:09.349000",
    "updated_date": "2026-05-07T13:30:09.349000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "FEZ PARTE DO CHECKPOINT #2",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/a3ed811fa_Ocarina.png",
    "description": "Participou da nossa reunião sobre Ocarina of Time!",
    "category": "participation",
    "is_secret": false,
    "rarity": "rare",
    "id": "69fc910760a5062ebdddcbf2",
    "created_date": "2026-05-07T13:17:59.691000",
    "updated_date": "2026-05-07T13:21:31.414000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "HERÓI DE HYRULE",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/73f6b3748_triforce.png",
    "description": "Concluiu Ocarina of Time com o Clube Checkpoint",
    "category": "game_completion",
    "is_secret": false,
    "rarity": "epic",
    "id": "69fc90c71e265f09c2e0ef30",
    "created_date": "2026-05-07T13:16:55.437000",
    "updated_date": "2026-05-21T04:43:46.572000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "EMBLEMA SECRETO",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/0f0ca34aa_lockicon.png",
    "description": "Recebido por realizar uma atividade ainda não revelada",
    "category": "secret",
    "is_secret": false,
    "rarity": "legendary",
    "id": "69c4c30742c4847ca6ffc781",
    "created_date": "2026-03-26T05:24:23.569000",
    "updated_date": "2026-03-26T05:24:33.114000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "DESDE QUANDO TUDO ERA MATO",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/b9a1b6c28_mato.png",
    "description": "Uma das 30 primeiras contas cadastradas no Clube.\nVocê está aqui desde quando tudo era mato!",
    "category": "special",
    "is_secret": false,
    "rarity": "legendary",
    "id": "69bb2ba9ce6299ef9855afba",
    "created_date": "2026-03-18T22:48:09.198000",
    "updated_date": "2026-03-18T22:57:40.330000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "JOGADOR  PERFECCIONISTA",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/0ecc9984d_badge.png",
    "description": "Você completou 100% de uma das aventuras do clube! Parabéns!\n(Válido para platinas, 1000G e 100%)",
    "category": "special",
    "is_secret": false,
    "rarity": "legendary",
    "id": "69b79d7b845ae3c30234550e",
    "created_date": "2026-03-16T06:04:43.905000",
    "updated_date": "2026-03-26T05:26:04.952000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "SOBREVIVEU À BULLWORTH",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/6163e4f35_bullworth-themed-merchandise-by-me-links-below-v0-d8zo15xzjqxd1.webp",
    "description": "Completou o jogo Bully como parte do Clube Checkpoint. Uma lenda em Bullworth!",
    "category": "game_completion",
    "is_secret": false,
    "rarity": "rare",
    "id": "69b1b8220e1ed3484432c7ed",
    "created_date": "2026-03-11T18:44:50.970000",
    "updated_date": "2026-03-16T05:59:07.864000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "MEMBRO FUNDADOR",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/public/69b1b67e54a545c4d25ee42a/0fffa3697_badgev2.png",
    "description": "Parabéns, você está aqui desde os primórdios!\nConcedido por paarticipar na primeira reunião",
    "category": "founder",
    "is_secret": false,
    "rarity": "legendary",
    "id": "69b1b8220e1ed3484432c7ea",
    "created_date": "2026-03-11T18:44:50.970000",
    "updated_date": "2026-03-16T06:05:39.653000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "name": "FEZ PARTE DO CHECKPOINT #1",
    "icon_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/bc0e58f9b_ac095ad411cd8efab83aaf094c201932.png",
    "description": "Participou da nossa reunião sobre BULLY!",
    "category": "events",
    "is_secret": false,
    "rarity": "epic",
    "id": "69b1b8220e1ed3484432c7ec",
    "created_date": "2026-03-11T18:44:50.970000",
    "updated_date": "2026-03-16T05:59:00.534000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  }
];

// 2. Exported Public Profiles
const defaultProfiles = [
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Hamilton de Campos",
    "featured_badges": "[]",
    "score": 0,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "6a3bc351c5916fb3b6db692c",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "Holodecoy",
    "id": "6a3bc37459133fad076fe836",
    "created_date": "2026-06-24T11:45:56.936000",
    "updated_date": "2026-06-24T11:47:59.351000",
    "created_by_id": "6a3bc351c5916fb3b6db692c",
    "created_by": "ham.campos120@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Vinicius Silva Almeida",
    "featured_badges": "[]",
    "score": 0,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "6a345904de56ec4a03161720",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "6a34590655263fac49baf5ef",
    "created_date": "2026-06-18T20:45:58.631000",
    "updated_date": "2026-06-18T20:46:31.343000",
    "created_by_id": "6a345904de56ec4a03161720",
    "created_by": "vinicius-alm@outlook.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "wallacenicholas84",
    "featured_badges": "[]",
    "score": 0,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "6a21e5b9ea5747858cb65a5c",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "6a21e5d2910d1ce88be11406",
    "created_date": "2026-06-04T20:53:38.768000",
    "updated_date": "2026-06-28T02:41:18.054000",
    "created_by_id": "6a21e5b9ea5747858cb65a5c",
    "created_by": "wallacenicholas84@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Emi",
    "featured_badges": "[]",
    "score": 0,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "6a1907391f14dad41fe11220",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "emilia",
    "id": "6a19074cdb0adda2c8183791",
    "created_date": "2026-05-29T03:26:04.280000",
    "updated_date": "2026-05-29T03:26:45.348000",
    "created_by_id": "6a1907391f14dad41fe11220",
    "created_by": "utilitynin@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Lucky",
    "featured_badges": "[]",
    "score": 0,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "6a07ba92c6a502e0a1493dde",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "6a07ba94fe18d17faabb97ab",
    "created_date": "2026-05-16T00:30:12.852000",
    "updated_date": "2026-05-16T00:35:12.218000",
    "created_by_id": "6a07ba92c6a502e0a1493dde",
    "created_by": "lukinhasluka2009@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Luis Nunes",
    "featured_badges": "[\"69fc93e15ec7880c9a989167\",\"69fc90c71e265f09c2e0ef30\"]",
    "score": 275,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/4e6548c84_tumblr_a82ce80a44f0355cb05fb19c5736bcdb_593972b0_1280.jpg",
    "discord": "lyzhz",
    "xbox_username": "",
    "user_id": "6a07987ba6a9ad61f91d8ff6",
    "steam": "https://steamcommunity.com/id/Lyzhz/",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/621eb7fad_Capturadetela2026-05-15165548.png",
    "psn_username": "",
    "username": "Lyzard",
    "id": "6a07987d59e4ea59ed921ac4",
    "created_date": "2026-05-15T22:04:45.623000",
    "updated_date": "2026-06-28T20:59:54.708000",
    "created_by_id": "6a07987ba6a9ad61f91d8ff6",
    "created_by": "luisnunes371@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "andré luis",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/fbdf9ebb1_oWqb5xyM_400x400.jpg",
    "discord": "",
    "xbox_username": "",
    "user_id": "6a0792641ed3fc0ebf62dd04",
    "steam": "https://steamcommunity.com/profiles/76561198058549979/",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/4a1937f4c_MHST3_1920x1080_EN.jpg",
    "psn_username": "",
    "username": "DREKU",
    "id": "6a07926640a88b167ca39d45",
    "created_date": "2026-05-15T21:38:46.236000",
    "updated_date": "2026-06-04T19:47:44.700000",
    "created_by_id": "6a0792641ed3fc0ebf62dd04",
    "created_by": "flygon100.al@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "_luan.png",
    "display_name": "Luan Vasconcelos",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/9f70d06e7_choso.jpg",
    "discord": "",
    "xbox_username": "",
    "user_id": "6a069634310e4b1e4e0c6d84",
    "steam": "https://steamcommunity.com/id/luanl/",
    "cover_image": "",
    "psn_username": "",
    "username": "Luan",
    "id": "6a069636c889efc0436a3a4f",
    "created_date": "2026-05-15T03:42:46.614000",
    "updated_date": "2026-06-09T11:34:57.747000",
    "created_by_id": "6a069634310e4b1e4e0c6d84",
    "created_by": "luanvasconcelos33@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "tleogms",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "6a0695d6b24f0a81f507504f",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "6a0695e2bae849cf07ed1033",
    "created_date": "2026-05-15T03:41:22.577000",
    "updated_date": "2026-05-19T01:06:43.753000",
    "created_by_id": "6a0695d6b24f0a81f507504f",
    "created_by": "leonardogmsilva05@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Kuromi “Conix” Duarte",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69e7fe7c120876d48095639b",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69e7fe7e3ec8dbc230cc4eaf",
    "created_date": "2026-04-21T22:47:26.719000",
    "updated_date": "2026-05-15T22:24:12.121000",
    "created_by_id": "69e7fe7c120876d48095639b",
    "created_by": "ryanduartesales1313@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Mika de Souza Loureiro",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69e4cd7d4a6efd9d33c64900",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69e4cd815efaee6c11031920",
    "created_date": "2026-04-19T12:41:37.896000",
    "updated_date": "2026-05-15T22:23:12.958000",
    "created_by_id": "69e4cd7d4a6efd9d33c64900",
    "created_by": "mikaszloureiro@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Luis Gabriel Rosa Ramos Pinto",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69e43f77751a52bc598986ed",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69e43f7a062501e943ce8425",
    "created_date": "2026-04-19T02:35:38.457000",
    "updated_date": "2026-05-15T22:22:23.661000",
    "created_by_id": "69e43f77751a52bc598986ed",
    "created_by": "luisgabrielrrpinto@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Gabriel",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69e439606650c678f26783c6",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69e43962233975c2fb1ad13e",
    "created_date": "2026-04-19T02:09:38.206000",
    "updated_date": "2026-05-15T22:23:52.658000",
    "created_by_id": "69e439606650c678f26783c6",
    "created_by": "rodrigo.gab.mariano21@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Mateus Tesch",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69e41ac7523e0a847bba993b",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69e41ac911971098aaa56fe6",
    "created_date": "2026-04-18T23:59:05.988000",
    "updated_date": "2026-05-15T22:22:59.746000",
    "created_by_id": "69e41ac7523e0a847bba993b",
    "created_by": "mateus.tesch5@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Vinicius F Souza",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69e40956287d9965793770f7",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69e409588e76cd5e660653e4",
    "created_date": "2026-04-18T22:44:40.828000",
    "updated_date": "2026-05-15T22:24:24.719000",
    "created_by_id": "69e40956287d9965793770f7",
    "created_by": "souza.viniciusf@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Bruno Rafael Severo",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69e21c0b624e9de9a6531544",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69e21c0e8123e3bf0b1c01da",
    "created_date": "2026-04-17T11:39:58.667000",
    "updated_date": "2026-05-15T22:21:12.651000",
    "created_by_id": "69e21c0b624e9de9a6531544",
    "created_by": "brunorafaelsevero22@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Samuel Almeida",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69e1ce5a1680c8d639012df9",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69e1ce5e8586528a9e61c22a",
    "created_date": "2026-04-17T06:08:30.422000",
    "updated_date": "2026-05-15T22:21:33.984000",
    "created_by_id": "69e1ce5a1680c8d639012df9",
    "created_by": "elder.mihawk@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Rodrigo Pessanha",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69e163734b940c6741da4dc4",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69e16376328380b307dfa68b",
    "created_date": "2026-04-16T22:32:22.049000",
    "updated_date": "2026-05-15T22:23:40.787000",
    "created_by_id": "69e163734b940c6741da4dc4",
    "created_by": "rodox92@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "Rnhkai",
    "display_name": "Renan Henrique",
    "featured_badges": "[]",
    "score": 175,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/71c99e516_1000000863.jpg",
    "discord": "hazael03284",
    "xbox_username": "",
    "user_id": "69e161985aad56073da40926",
    "steam": "https://steamcommunity.com/profiles/76561199820038510/friends",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/6d66cc102_2881fd96bb8216330ebeb46669e58cd1.jpg",
    "psn_username": "",
    "username": "",
    "id": "69e1619a5a222dc7461ca566",
    "created_date": "2026-04-16T22:24:26.501000",
    "updated_date": "2026-06-23T23:27:48.104000",
    "created_by_id": "69e161985aad56073da40926",
    "created_by": "rnh.1694@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "sarahkhass",
    "featured_badges": "[]",
    "score": 150,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69bb4c87223307752e5badca",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69bb4cacdb39d390b785d40c",
    "created_date": "2026-03-19T01:09:00.676000",
    "updated_date": "2026-05-18T19:11:45.550000",
    "created_by_id": "69bb4c87223307752e5badca",
    "created_by": "sarahkhass@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Vitor Nagel",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69bb48fc055dae9afb83104e",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69bb48fe63e85469ea912b92",
    "created_date": "2026-03-19T00:53:18.801000",
    "updated_date": "2026-03-19T01:44:58.338000",
    "created_by_id": "69bb48fc055dae9afb83104e",
    "created_by": "vitornva6@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "'@bressan.na",
    "display_name": "Ana Bressan",
    "featured_badges": "[\"69bb2ba9ce6299ef9855afba\"]",
    "score": 275,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/0ae917eed_WhatsAppImage2025-11-07at08562111.jpeg",
    "discord": "miss047",
    "xbox_username": "",
    "user_id": "69bb3b459e926a73240d1dcc",
    "steam": 1083734467,
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/4c0e876d9_faf6affa4f8e94c67c60532a3fbfea71.jpg",
    "psn_username": "",
    "username": "Miss",
    "id": "69bb3b47d22db44b8c1143ff",
    "created_date": "2026-03-18T23:54:47.794000",
    "updated_date": "2026-05-18T10:41:38.061000",
    "created_by_id": "69bb3b459e926a73240d1dcc",
    "created_by": "anna1bressan@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "Aceito recomendações\n\nMy setup: \nRx6600 8gb\n32gb RAM DDR4\nRyzen 5 5600GT\n2TB\nA520M AM4\n\nConsoles:\nPlaystation 5 Slim\nXbox 360 RGH\nXbox One\nNintendo Switch OLED\n\nMobile:\nTablet Gamer\nRedmi note 14S",
    "instagram": "'@jonatassaiuro",
    "display_name": "Jonatassauro",
    "featured_badges": "[\"69bb2ba9ce6299ef9855afba\"]",
    "score": 100,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/480932f1a_1000098296.png",
    "discord": "Jonatassauro#1734",
    "xbox_username": "Jowms1",
    "user_id": "69b8a999f9543e60706ef319",
    "steam": 314465283,
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/fe9d7862c_1000102512.jpg",
    "psn_username": "Soh_Mont",
    "username": "Jonata O Sauro",
    "id": "69b9b65d4682aa4bac958633",
    "created_date": "2026-03-17T20:15:25.623000",
    "updated_date": "2026-03-19T04:33:32.554000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Radamés",
    "featured_badges": "[]",
    "score": 350,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/c9fbc92e7_100273.jpg",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b8974057f9b92f893ef25b",
    "steam": "",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/07b27102a_7146dcc2-fc50-4c2c-8787-00e4e45250aa-1_all_4251.jpg",
    "psn_username": "",
    "username": "Radaagod",
    "id": "69b9b65d4682aa4bac958635",
    "created_date": "2026-03-17T20:15:25.623000",
    "updated_date": "2026-06-23T23:27:41.754000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "Que seja épico!",
    "instagram": "pocketlink12",
    "display_name": "João Victor Barcelos",
    "featured_badges": "[\"69fc93e15ec7880c9a989167\",\"69fc90c71e265f09c2e0ef30\",\"69b1b8220e1ed3484432c7ea\",\"6a0b64d3414069dbb3ddbe9b\"]",
    "score": 825,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/2f8462ea0_68bc3bbe-5e9f-4efa-bee9-cffc1454eb42-1_all_594.jpg",
    "discord": "Sawuei",
    "xbox_username": "Sawuei",
    "user_id": "69b89795355340c9ea213b51",
    "steam": "Sawuei",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/9ae013c1e_1000489374.avif",
    "psn_username": "Sawuei",
    "username": "Sawuei",
    "id": "69b9b65d4682aa4bac958634",
    "created_date": "2026-03-17T20:15:25.623000",
    "updated_date": "2026-06-28T15:30:40.623000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Tiago Ruaro",
    "featured_badges": "[]",
    "score": 275,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/b690e7d69_Capturadetela2026-03-17112509.png",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b96318a1d8b625ff3b8d76",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69b9b64a4682aa4bac958622",
    "created_date": "2026-03-17T20:15:06.629000",
    "updated_date": "2026-04-17T10:59:36.077000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "Sou da década de 90 mas comecei a jogar single player \"recente\" (2020), e venho jogando as principais indicaçoes da comunidade. \nNão me importo muito com gráficos ou hype de lancamento.",
    "instagram": "_nerialexandre",
    "display_name": "Alexandre Neri",
    "featured_badges": "[]",
    "score": 300,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/be4d77369_Designsemnome.png",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b94f648e7201c8b0270c52",
    "steam": "",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/b9af78f61_red-dead-redemption-3440x1440-10815.jpg",
    "psn_username": "",
    "username": "Tenark",
    "id": "69b9b64a4682aa4bac958625",
    "created_date": "2026-03-17T20:15:06.629000",
    "updated_date": "2026-05-21T19:46:38.035000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "'@antunix_",
    "display_name": "Guilherme Antunes",
    "featured_badges": "[]",
    "score": 150,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/b491210ad_a36f54f2-ce49-4ffc-bd73-659c966b4425.jpeg",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b8ca2f14813bbce41ca198",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "Vacilaum",
    "id": "69b9b64a4682aa4bac958629",
    "created_date": "2026-03-17T20:15:06.629000",
    "updated_date": "2026-06-23T23:27:45.043000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Phelipe Santos",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b95ea7e3adf7f8a5f0125c",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69b9b64a4682aa4bac958623",
    "created_date": "2026-03-17T20:15:06.629000",
    "updated_date": "2026-04-06T15:45:16.972000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "Sou um cara",
    "instagram": "Albudanee",
    "display_name": "Lucas Marinho",
    "featured_badges": "[\"69bb2ba9ce6299ef9855afba\"]",
    "score": 225,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/f20c92acb_d2d0c935-d11d-4188-b7a5-63c331ea59b5.jpeg",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b9577cf3a6a0ded97ac5df",
    "steam": "Albudane",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/31541099b_IMG_0472.jpeg",
    "psn_username": "",
    "username": "Albudane",
    "id": "69b9b64a4682aa4bac958624",
    "created_date": "2026-03-17T20:15:06.629000",
    "updated_date": "2026-05-29T03:14:48.308000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "peixe",
    "instagram": "hansengb01",
    "display_name": "Gabriel Hansen",
    "featured_badges": "[\"69bb2ba9ce6299ef9855afba\"]",
    "score": 225,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/4d5d25593_IMG_1021.jpeg",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b943f5f7eb7bf2ca8a5463",
    "steam": "",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/a20a95556_IMG_3575.jpeg",
    "psn_username": "",
    "username": "Hansen",
    "id": "69b9b64a4682aa4bac958627",
    "created_date": "2026-03-17T20:15:06.629000",
    "updated_date": "2026-06-23T23:27:46.622000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Felipe sts",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b945c331d9f3661199283a",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69b9b64a4682aa4bac958626",
    "created_date": "2026-03-17T20:15:06.629000",
    "updated_date": "2026-03-18T23:36:38.862000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "",
    "display_name": "Pablo Garcia Schuabb",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b93ac1adf5acbd6baf62ce",
    "steam": "",
    "cover_image": "",
    "psn_username": "",
    "username": "",
    "id": "69b9b64a4682aa4bac958628",
    "created_date": "2026-03-17T20:15:06.629000",
    "updated_date": "2026-03-18T23:36:41.421000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "",
    "instagram": "lhenriquen",
    "display_name": "Luiz Henrique LH",
    "featured_badges": "[]",
    "score": 100,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/8ec9ae2cf_ImagemdoWhatsAppde2025-10-21s202801_9c909c46.jpg",
    "discord": "lhenriquen",
    "xbox_username": "",
    "user_id": "69b8aed973da2c39291b69e2",
    "steam": "",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/86c343ab4_81C81CB44922409EA3C99FA3E42369CD.jpg",
    "psn_username": "",
    "username": "lhenriquen",
    "id": "69b9b64a4682aa4bac95862a",
    "created_date": "2026-03-17T20:15:06.629000",
    "updated_date": "2026-03-19T01:58:00.747000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "Co-founder - Gamer.",
    "instagram": "Odavimuller",
    "display_name": "Davi Muller",
    "featured_badges": "[\"69bb2ba9ce6299ef9855afba\",\"69b1b8220e1ed3484432c7ea\",\"69fc90c71e265f09c2e0ef30\"]",
    "score": 500,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/faf3dad0e_Capturadetela2026-03-16204049.png",
    "discord": "",
    "xbox_username": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "steam": "https://steamcommunity.com/profiles/76561198840007368/",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/77fe9301c_N-sanity-island-2.webp",
    "psn_username": "",
    "username": "Deive",
    "id": "69b9b578b89965553f1d7780",
    "created_date": "2026-03-17T20:11:36.129000",
    "updated_date": "2026-06-23T23:27:40.235000",
    "created_by_id": "69b893cea2786ffc06731c7e",
    "created_by": "davimullermuller12@gmail.com",
    "is_sample": false
  },
  {
    "games_completed": 0,
    "meetings_attended": 0,
    "bio": "Animado para jogar com todos!",
    "instagram": "gustavohenrique54",
    "display_name": "Gustavo Henrique",
    "featured_badges": "[\"69b1b8220e1ed3484432c7ed\",\"69b1b8220e1ed3484432c7ea\",\"69fc90c71e265f09c2e0ef30\",\"6a0e8d658609debd2366d2f3\"]",
    "score": 500,
    "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/61b67dd6b_awratfawrawtawerawt.png",
    "discord": "gugonico",
    "xbox_username": "Gugolho",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "steam": "https://steamcommunity.com/id/gugarossauro",
    "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/public/69b1b67e54a545c4d25ee42a/b7f970765_5.png",
    "psn_username": "Gugahsouza",
    "username": "viradoembraco",
    "id": "69b9b0f17cadd236b081699d",
    "created_date": "2026-03-17T19:52:17.206000",
    "updated_date": "2026-06-28T23:36:19.353000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  }
];

// 3. Exported Club Hub Info
const defaultClubHub = [
  {
    "active_game_description": "Um dos maiores clássicos da Era PS1. Entre na pele do filho do próprio mal encarnado, Drácula, para desvendar os segredos do castelo!",
    "active_game_image": "https://upload.wikimedia.org/wikipedia/pt/e/e0/Castlevania_Symphony_of_the_Night_Capa.jpg",
    "next_meeting_datetime": "2026-06-21T19:00",
    "active_game_title": "Castlevania SotN",
    "meeting_location": "Link será enviado pelo grupo",
    "id": "69b3aaa1d539ed00273220a9",
    "created_date": "2026-03-13T06:11:45.439000",
    "updated_date": "2026-06-28T21:07:41.026000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  }
];

// 4. Exported News Articles
const defaultClubNews = [
  {
    "cover_image": "https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_1.5/c_scale,w_500/store/software/switch/70010000050844/9c63a7769e5924788891d361543f04b101673bde95a9145dda651f8ec5e192b9",
    "title": "Instruções de Instalação - Alan Wake - Checkpoint #03",
    "excerpt": "O novo escolhido para o checkpoint #03 é o grandioso Alan Wake!",
    "content": "Instruções de download:\n\nOk! O novo escolhido pro checkpoint #03 é o grandioso Alan Wake!\n\nPra começo de conversa, o jogo tem duas versões, a versão clássica e a versão REMASTERIZADA, a comunidade do jogo recomenda para novos jogadores que joguem a versão remasterizada, argumentando que ela inclui gráficos muito melhorados, mantendo a atmosfera, a versão remasterizada também é a única que possui tradução nativa para PT-BR.\n\nA VERSÃO REMASTERIZADA NÃO ESTÁ DISPONÍVEL NA STEAM.\nA Remedy (desenvolvedora do jogo) tem uma parceria com a Epic Games, o Alan Wake 2 também só pode ser comprado na Epic.\n\nPra nossa sorte o jogo está no momento custando R$ 8,54 na Epic Games e quem tem Playstation Plus pode já ter resgatado o jogo que foi liberado gratuitamente anteriormente na assinatura.\n\nSegue o link de compra do jogo na Epic Games:\n\nhttps://store.epicgames.com/p/alan-wake-remastered\n\nOs jogadores de console podem comprar o jogo nas suas respectivas plataformas normalmente.\n\nAgora, para os jogadores que ainda assim preferem os meios não oficiais, a \"Brasil Respawn\" já tem o jogo disponível (FitGirl Repack) com todas as instruções necessárias no seguinte link:\n\nhttps://brasilrespawn.com/alan-wake-remastered-v1-33-build-34885-3-dlcs-pt-br-torrent-fitgirl-repack/\n\nBom jogo pessoal!",
    "is_published": true,
    "id": "6a0b66bb32359e104bef1372",
    "created_date": "2026-05-18T19:21:31.888000",
    "updated_date": "2026-05-18T19:21:31.888000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "cover_image": "https://image.api.playstation.com/vulcan/img/rnd/202109/2709/XEAp2SwR2RiX0J9bTYkHeG2B.jpg",
    "title": "A terceira aventura do clube foi escolhida!",
    "excerpt": "Um thriller psicológico inspirado em Stephen King e Twin Peaks, onde a luz é a principal arma contra forças sobrenaturais que emergem da escuridão.",
    "content": "Durante muito tempo, Bright Falls permaneceu adormecida.\nUma pequena cidade cercada por florestas, névoa e sombras… onde algo antigo continua ecoando entre as árvores.\u0003\u0003Nas próximas semanas, atravessaremos estradas vazias iluminadas apenas por faróis, florestas tomadas pela escuridão e páginas de uma história que talvez já tenha sido escrita antes mesmo de chegarmos nela.\n\nMas cuidado.\u0003A luz não é conforto. Ela é sobrevivência.\n\nPrepare sua lanterna.\nMantenha os olhos abertos.\nE siga a luz.\n\nAlan Wake é a nova aventura do Clube Checkpoint",
    "is_published": true,
    "id": "6a0b66732397b5479cc97896",
    "created_date": "2026-05-18T19:20:19.022000",
    "updated_date": "2026-05-18T19:20:19.022000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "cover_image": "https://zeldauniverse.net/wp-content/uploads/2020/06/Great-deku-tree-e1592444082235-886x447.png",
    "title": "Instruções de Instalação - Ocarina of Time",
    "excerpt": "Versão definitiva do Clube Checkpoint de The Legend of Zelda: Ocarina of Time",
    "content": "Versão definitiva do Clube Checkpoint de The Legend of Zelda: Ocarina of Time\n\nPessoal, primeiro, introduzindo a versão, o que preparamos aqui é uma configuração personalizada do port chamado de Ship of Harkinian, em 2022 um grupo de fãs MUITO dedicado conseguiu decompilar o código-fonte do Ocarina of Time, eles usaram isso para montar um port que roda nativamente em PCs, Mac, Linux e até mobile. ESSE PORT NÃO É UMA EMULAÇÃO, porém ele usa uma rom original de Ocarina of Time fornecida pelo jogador pra recompilar o jogo, se perguntarem, eu tenho uma fita e um gravador, puxei a rom pro meu PC e usei ela pra buildar essa versão (kk).\n\nOptamos por manter o jogo na versão mais semelhante possível à original, porém adicionando melhorias de qualidade de vida para pelo menos alguns padrões dos dias atuais, dito isso, as melhorias que estão ativadas são:\n\nTela Widescreen sem distorção\nTradução para PT-BR\nAlteração nos ícones de botões de controles para mostrarem botões de Playstation\n60 FPS\nResolução aumentada de 240p para 1080p\nDraw Distance aumentado\nAnti-aliasing aumentado\nRetextura (somente resolução) dos ícones para que sejam bem visíveis em telas 1080p\nConfiguração já embutida de controle para controles modernos (testado em controles PS e Switch)\nConfiguração de câmera livre (para controle de câmera com o analógico direito)\n\nO que você precisa fazer para jogar?\n\nSomente baixar o arquivo do link:\nhttps://drive.google.com/file/d/17VQSYZACkFsxW0XNUIbzTCXrkrwNd7FY/view?usp=sharing\n\nE iniciar o jogo clicando em: soh.exe\n\nAlgumas dicas importantes:\n\nConfigurei para interagir com a Navi no botão R3 (pressionar o analógico direito)\nESC é o botão para abrir e fechar o menu do port, lá você tem acesso à todas as configurações que fizemos e mais uma infinidade de outras",
    "is_published": true,
    "id": "69dd2e53f2d392fc8c78ee8b",
    "created_date": "2026-04-13T17:56:35.760000",
    "updated_date": "2026-04-13T17:56:35.760000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "cover_image": "https://m.media-amazon.com/images/I/61+6b-FXwgL._AC_UF1000,1000_QL80_.jpg",
    "title": "A segunda aventura está entre nós!",
    "excerpt": "Há muito tempo, uma jornada aguarda por aqueles que ainda escutam o chamado. Você vai responder?",
    "content": "Se esta mensagem chegou até você…\nnão foi por acaso.\n\nHá muito tempo, uma jornada aguarda por aqueles que ainda escutam o chamado. O destino clama.\n\nUma antiga história desperta novamente.\nUma terra esquecida pelo tempo urge por socorro.\n\nFlorestas, templos, segredos…\ne uma ocarina cujo som atravessa eras.\n\nO próximo caminho já foi escolhido.\n\nA jornada que se inicia é:\nThe Legend of Zelda: Ocarina of Time.\n\nO tempo não espera.\nE aqueles que ignoram o chamado…\njamais descobrirão o que poderiam ter se tornado.\n\nPegue sua espada.\nEscute o vento.\nE dê o primeiro passo.\n\nNos vemos em Hyrule.",
    "is_published": true,
    "id": "69dd2d60481610fdfdc7dce3",
    "created_date": "2026-04-13T17:52:32.904000",
    "updated_date": "2026-04-13T17:53:30.221000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "cover_image": "https://play-lh.googleusercontent.com/XYAODeGMRasiYOy0eOk0TkA5O00Zjp5l3bWPBwLEFB5uEX4ikiidyveF5cmOrqzDcAc=w526-h296-rw",
    "title": "BULLY - Instruções de instalação",
    "excerpt": "Links de download oficiais e alternativos e MODs de melhoria de qualidade de vida.",
    "content": "Prontos pra se aventurarem pela cidade de Bullworth?\n\nPra facilitar pra todo mundo aqui vai um guia sobre o jogo:\n\nBully é um jogo \"mal cuidado\" no PC, ele precisa de alguns mods e alguns fixes pra rodar perfeitamente em máquinas atuais, mesmo na versão mais recente da Steam. Pensando nisso já compactei uma versão \"alternativa\" (se é que me entendem kk) com os mods necessários instalados, vou explicar abaixo quais são eles e pra quê servem, o link dela é esse aqui:\n\nLINK: https://drive.google.com/drive/folders/1l0zqLX9ps9bMxmKHA4aMpWegoFsO_jah?usp=sharing\nGoogle Drive\nSeja usando essa versão alternativa ou com a versão da Steam, existem problemas como resolução esticada e crashes constantes na versão de PC, a versão que subi no link acima JÁ POSSUI TODOS OS MODS E FIXES QUE VOU CITAR INSTALADOS assim como uma tradução completa para pt-br ✅\n\nOs mods instalados são os seguintes:\n\nTradução em PT-BR (Gamevicio): A tradução do jogo para português (as legendas têm que ser ativadas nas opções dentro do jogo).\nWidescreen FIX by Thirteenag: Esse mod possibilita as resoluções de 16:9 sem deixar tudo com um aspecto \"esticado\".\nSilentPatch by CookieMonster: Esse fix melhora a estabilidade e para uns crashes constantes muito comuns, ele também possibilita que configurem o jogo para 60 FPS.\n\nSobre o SilentPatch: Está funcionando normalmente, porém não deixei ativada por padrão a opção de 60 FPS, pelos seguintes motivos:\n\nDefina o limite de FPS para a taxa de atualização do seu monitor e ative o VSync. Caso contrário, o jogo poderá rodar em velocidade dupla se o seu FPS exceder a taxa de atualização do monitor.\n\nComo Bully nunca foi projetado para rodar a 60 FPS, alguns problemas podem ocorrer. (Isso não é uma falha da Rockstar, mas sim do motor gráfico do jogo).\n\nEsses problemas podem ser resolvidos voltando temporariamente para 30 FPS.\n\nO jogo PODE travar durante a missão \"Balls of Snow\" no Capítulo 3, onde há uma chance de Jimmy ter disparo rápido ou congelar no lugar, sem conseguir se mover.\n\nDurante a missão \"Finding Johnny Vincent\" do Capítulo 5, você pode ter problemas para abrir um portão que exige que você pressione um botão repetidamente. Volte para 30 FPS ou use temporariamente os controles do teclado.\n\nEntão caso queiram ativar o modo de 60 FPS e depois desativar temporariamente se encontrarem esses 2 erros é só acessar o arquivo \"SilentPatchBully.ini\" na pasta do jogo e simplesmente alterar o valor em \"FPSLimit\"\n\nÉ isso sobre os fixes no jogo rapazeada, agora, eu encontrei um erro que foi particularmente no meu PC, quando abri o jogo ele me deu uma mensegem de erro de \"configuração lado a lado\" e um outro erro de sistema de áudio, ambos eu corrigi instalando uma versão adicional antiga do DirectX, imagino que como o jogo é antigo ele deve precisar de alguns arquivos da época, adicionei esse arquivo do DirectX na pasta do drive também!",
    "is_published": true,
    "id": "69b3ba9d16357d96627b418d",
    "created_date": "2026-03-13T07:19:57.148000",
    "updated_date": "2026-03-13T07:21:47.412000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "cover_image": "https://store-images.s-microsoft.com/image/apps.22912.66873235889732843.685adf61-8959-427d-8c3e-e4a5ef4bf7f5.430d3a55-1a75-4b7a-8bd0-021b167285a1?q=90&w=480&h=270",
    "title": "Nosso primeiro jogo foi escolhido",
    "excerpt": "A nossa escolha do mês já foi feita, e o próximo título que vamos encarar tem um \"cheiro\" de nostalgia... e de confusão no pátio",
    "content": "O SINO TOCOU! 🔔\n\nA nossa escolha do mês já foi feita, e o próximo título que vamos encarar tem um \"cheiro\" de nostalgia... e de confusão no pátio. 🏫\n\nPreparem os uniformes (ou o que sobrou deles) e deixem os estilingues guardados. Vamos revisitar um clássico onde ser o \"pior\" aluno pode ser a única forma de sobreviver à hierarquia social.",
    "is_published": true,
    "id": "69b3ba31f6d981de8c784e42",
    "created_date": "2026-03-13T07:18:09.625000",
    "updated_date": "2026-03-13T07:21:24.560000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  }
];

// 5. Exported Navigation Links
const defaultClubLinks = [
  {
    "description": "Nosso WhatsApp Oficial",
    "title": "WhatsApp",
    "emoji": "📞",
    "url": "https://chat.whatsapp.com/JVGqnKX1kwF0OziV6k5OoB",
    "id": "69b3aea9e7361b9cbc541ac2",
    "created_date": "2026-03-13T06:28:57.338000",
    "updated_date": "2026-03-13T07:16:59.063000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "description": "Nosso Discord Oficial",
    "title": "Discord",
    "emoji": "🔊",
    "url": "https://discord.gg/dz6xwXNhkc",
    "id": "69b3ae6f599ef1521f04a51d",
    "created_date": "2026-03-13T06:27:59.534000",
    "updated_date": "2026-03-13T07:17:09.149000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  }
];

// 6. Exported User Badges
const defaultUserBadges = [
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e161985aad56073da40926",
    "id": "6a3b167312a53256dd423fda",
    "created_date": "2026-06-23T23:27:47.253000",
    "updated_date": "2026-06-23T23:27:47.253000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8e1acb0ad7b3573aad05",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e161985aad56073da40926",
    "id": "6a3b1672ae906edfd60e115a",
    "created_date": "2026-06-23T23:27:46.923000",
    "updated_date": "2026-06-23T23:27:46.923000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b943f5f7eb7bf2ca8a5463",
    "id": "6a3b167124140ed052478b55",
    "created_date": "2026-06-23T23:27:45.636000",
    "updated_date": "2026-06-23T23:27:45.636000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8e1acb0ad7b3573aad05",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b943f5f7eb7bf2ca8a5463",
    "id": "6a3b167104c193792931a3b1",
    "created_date": "2026-06-23T23:27:45.314000",
    "updated_date": "2026-06-23T23:27:45.314000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8ca2f14813bbce41ca198",
    "id": "6a3b167006695d4cfd62c7d4",
    "created_date": "2026-06-23T23:27:44.266000",
    "updated_date": "2026-06-23T23:27:44.266000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8e1acb0ad7b3573aad05",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8ca2f14813bbce41ca198",
    "id": "6a3b166f86f45f33118b868d",
    "created_date": "2026-06-23T23:27:43.569000",
    "updated_date": "2026-06-23T23:27:43.569000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a3b166e59996923e365e771",
    "created_date": "2026-06-23T23:27:42.339000",
    "updated_date": "2026-06-23T23:27:42.339000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8e1acb0ad7b3573aad05",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a3b166e13e136ce1bb1cf44",
    "created_date": "2026-06-23T23:27:42.025000",
    "updated_date": "2026-06-23T23:27:42.025000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8974057f9b92f893ef25b",
    "id": "6a3b166c540f6d400cd1f9e1",
    "created_date": "2026-06-23T23:27:40.860000",
    "updated_date": "2026-06-23T23:27:40.860000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8e1acb0ad7b3573aad05",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8974057f9b92f893ef25b",
    "id": "6a3b166c13e136ce1bb1cf43",
    "created_date": "2026-06-23T23:27:40.543000",
    "updated_date": "2026-06-23T23:27:40.543000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "6a3b166bf8313dadc840fe7e",
    "created_date": "2026-06-23T23:27:39.436000",
    "updated_date": "2026-06-23T23:27:39.436000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8e1acb0ad7b3573aad05",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "6a3b166bdf39f4c1b7b4a956",
    "created_date": "2026-06-23T23:27:39.183000",
    "updated_date": "2026-06-23T23:27:39.183000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "6a3b166a9bacc81a3c9042c8",
    "created_date": "2026-06-23T23:27:38.066000",
    "updated_date": "2026-06-23T23:27:38.066000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8e1acb0ad7b3573aad05",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "6a3b1669d806b33476d706bd",
    "created_date": "2026-06-23T23:27:37.400000",
    "updated_date": "2026-06-23T23:27:37.400000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8cdc4c60b9d500f6214a",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a30a3ee74ffaa5e9be33495",
    "created_date": "2026-06-16T01:16:30.644000",
    "updated_date": "2026-06-16T01:16:30.644000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8d658609debd2366d2f3",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a30a3ee321860e5a8165a3b",
    "created_date": "2026-06-16T01:16:30.339000",
    "updated_date": "2026-06-16T01:16:30.339000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b943f5f7eb7bf2ca8a5463",
    "id": "6a30a3e2ecc9d820d264b01a",
    "created_date": "2026-06-16T01:16:18.563000",
    "updated_date": "2026-06-16T01:16:18.563000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a30a3e1e96235b54369acae",
    "created_date": "2026-06-16T01:16:17.408000",
    "updated_date": "2026-06-16T01:16:17.408000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8974057f9b92f893ef25b",
    "id": "6a30a3df63056700372d840d",
    "created_date": "2026-06-16T01:16:15.914000",
    "updated_date": "2026-06-16T01:16:15.914000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0e8de5413c0c132849ec93",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e161985aad56073da40926",
    "id": "6a1ef7e41e919014391d5e99",
    "created_date": "2026-06-02T15:33:56.657000",
    "updated_date": "2026-06-02T15:33:56.657000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "6a0b64d3414069dbb3ddbe9b",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a0b64f07903918060953ea0",
    "created_date": "2026-05-18T19:13:52.915000",
    "updated_date": "2026-05-18T19:13:52.915000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc90c71e265f09c2e0ef30",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "6a07987ba6a9ad61f91d8ff6",
    "id": "6a0b6488ce816b1340d0b059",
    "created_date": "2026-05-18T19:12:08.600000",
    "updated_date": "2026-05-18T19:12:08.600000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc90c71e265f09c2e0ef30",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "6a0b64879eaf0dde1cd750bf",
    "created_date": "2026-05-18T19:12:07.420000",
    "updated_date": "2026-05-18T19:12:07.420000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc90c71e265f09c2e0ef30",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a0b648664cdc8574d9200cf",
    "created_date": "2026-05-18T19:12:06.145000",
    "updated_date": "2026-05-18T19:12:06.145000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc90c71e265f09c2e0ef30",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "6a0b648462f0c23b6abc1a51",
    "created_date": "2026-05-18T19:12:04.920000",
    "updated_date": "2026-05-18T19:12:04.920000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc910760a5062ebdddcbf2",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "6a07987ba6a9ad61f91d8ff6",
    "id": "6a0b6472a0fefc4459d9354b",
    "created_date": "2026-05-18T19:11:46.084000",
    "updated_date": "2026-05-18T19:11:46.084000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "6a07987ba6a9ad61f91d8ff6",
    "id": "6a0b647152eb1eb6e7e85ce6",
    "created_date": "2026-05-18T19:11:45.816000",
    "updated_date": "2026-05-18T19:11:45.816000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc910760a5062ebdddcbf2",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69bb4c87223307752e5badca",
    "id": "6a0b6470765d7197585b6f37",
    "created_date": "2026-05-18T19:11:44.522000",
    "updated_date": "2026-05-18T19:11:44.522000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69bb4c87223307752e5badca",
    "id": "6a0b6470f18f0ee179f08be2",
    "created_date": "2026-05-18T19:11:44.210000",
    "updated_date": "2026-05-18T19:11:44.210000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc910760a5062ebdddcbf2",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "6a0b646fbe1b27f1235bac08",
    "created_date": "2026-05-18T19:11:43.082000",
    "updated_date": "2026-05-18T19:11:43.082000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "6a0b646eb8ecbd8350b4ceba",
    "created_date": "2026-05-18T19:11:42.811000",
    "updated_date": "2026-05-18T19:11:42.811000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc910760a5062ebdddcbf2",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a0b646d32aea4138348cf91",
    "created_date": "2026-05-18T19:11:41.674000",
    "updated_date": "2026-05-18T19:11:41.674000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a0b646de3d965f8f91a34e7",
    "created_date": "2026-05-18T19:11:41.401000",
    "updated_date": "2026-05-18T19:11:41.401000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc910760a5062ebdddcbf2",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "6a0b646caae8797a74338a62",
    "created_date": "2026-05-18T19:11:40.180000",
    "updated_date": "2026-05-18T19:11:40.180000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "6a0b646b3cb701416288df63",
    "created_date": "2026-05-18T19:11:39.872000",
    "updated_date": "2026-05-18T19:11:39.872000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc90c71e265f09c2e0ef30",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "6a07987ba6a9ad61f91d8ff6",
    "id": "6a079de3bb30fe038d41c079",
    "created_date": "2026-05-15T22:27:47.070000",
    "updated_date": "2026-05-15T22:27:47.070000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "6a07987ba6a9ad61f91d8ff6",
    "id": "6a079de0083dcae1b1023543",
    "created_date": "2026-05-15T22:27:44.609000",
    "updated_date": "2026-05-15T22:27:44.609000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b943f5f7eb7bf2ca8a5463",
    "id": "6a079d78d3dd7bc1f0329148",
    "created_date": "2026-05-15T22:26:00.817000",
    "updated_date": "2026-05-15T22:26:00.817000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc90c71e265f09c2e0ef30",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "6a079d69cd7fd8bf9c5a0996",
    "created_date": "2026-05-15T22:25:45.958000",
    "updated_date": "2026-05-15T22:25:45.958000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "6a079d6936586f3818eaa77a",
    "created_date": "2026-05-15T22:25:45.641000",
    "updated_date": "2026-05-15T22:25:45.641000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc90c71e265f09c2e0ef30",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a079d68b1f44609fe7756dd",
    "created_date": "2026-05-15T22:25:44.417000",
    "updated_date": "2026-05-15T22:25:44.417000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "6a079d68810fc857b9cc4b9b",
    "created_date": "2026-05-15T22:25:44.090000",
    "updated_date": "2026-05-15T22:25:44.090000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b94f648e7201c8b0270c52",
    "id": "6a079d6675d7f3b86757e272",
    "created_date": "2026-05-15T22:25:42.640000",
    "updated_date": "2026-05-15T22:25:42.640000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc90c71e265f09c2e0ef30",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "6a079d2f8ced2666f0c4c8a7",
    "created_date": "2026-05-15T22:24:47.478000",
    "updated_date": "2026-05-15T22:24:47.478000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69fc93e15ec7880c9a989167",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "6a079d2a912f0f1c78592da6",
    "created_date": "2026-05-15T22:24:42.990000",
    "updated_date": "2026-05-15T22:24:42.990000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e40956287d9965793770f7",
    "id": "6a079d17497446803a00f0ab",
    "created_date": "2026-05-15T22:24:23.636000",
    "updated_date": "2026-05-15T22:24:23.636000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e7fe7c120876d48095639b",
    "id": "6a079d0b46b3610022dccb38",
    "created_date": "2026-05-15T22:24:11.017000",
    "updated_date": "2026-05-15T22:24:11.017000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e439606650c678f26783c6",
    "id": "6a079cf7d43aada7380303dc",
    "created_date": "2026-05-15T22:23:51.426000",
    "updated_date": "2026-05-15T22:23:51.426000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e163734b940c6741da4dc4",
    "id": "6a079cebcdd57df03396dd74",
    "created_date": "2026-05-15T22:23:39.418000",
    "updated_date": "2026-05-15T22:23:39.418000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e161985aad56073da40926",
    "id": "6a079ce1343166b9ca8511a4",
    "created_date": "2026-05-15T22:23:29.643000",
    "updated_date": "2026-05-15T22:23:29.643000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e4cd7d4a6efd9d33c64900",
    "id": "6a079ccf6c1ab0cf7c22661c",
    "created_date": "2026-05-15T22:23:11.530000",
    "updated_date": "2026-05-15T22:23:11.530000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e41ac7523e0a847bba993b",
    "id": "6a079cc24a1ffd5eccc7cecc",
    "created_date": "2026-05-15T22:22:58.709000",
    "updated_date": "2026-05-15T22:22:58.709000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "6a07987ba6a9ad61f91d8ff6",
    "id": "6a079cb7d8b9ca1063ffd928",
    "created_date": "2026-05-15T22:22:47.158000",
    "updated_date": "2026-05-15T22:22:47.158000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "6a069634310e4b1e4e0c6d84",
    "id": "6a079ca986947a46f191cb02",
    "created_date": "2026-05-15T22:22:33.326000",
    "updated_date": "2026-05-15T22:22:33.326000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e43f77751a52bc598986ed",
    "id": "6a079c9e9b89fd50b82b3000",
    "created_date": "2026-05-15T22:22:22.562000",
    "updated_date": "2026-05-15T22:22:22.562000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "6a0695d6b24f0a81f507504f",
    "id": "6a079c8b762ce18963b30c50",
    "created_date": "2026-05-15T22:22:03.246000",
    "updated_date": "2026-05-15T22:22:03.246000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "6a0792641ed3fc0ebf62dd04",
    "id": "6a079c791ab074a55ab2ee19",
    "created_date": "2026-05-15T22:21:45.219000",
    "updated_date": "2026-05-15T22:21:45.219000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e1ce5a1680c8d639012df9",
    "id": "6a079c6cfe18d17faabb75e9",
    "created_date": "2026-05-15T22:21:32.911000",
    "updated_date": "2026-05-15T22:21:32.911000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69e21c0b624e9de9a6531544",
    "id": "6a079c5730863b9778f378c7",
    "created_date": "2026-05-15T22:21:11.599000",
    "updated_date": "2026-05-15T22:21:11.599000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ed",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b96318a1d8b625ff3b8d76",
    "id": "69d40b5555647952dbbc9797",
    "created_date": "2026-04-06T19:36:53.473000",
    "updated_date": "2026-04-06T19:36:53.473000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ec",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b96318a1d8b625ff3b8d76",
    "id": "69d40b52ed5d3c0ccefb8946",
    "created_date": "2026-04-06T19:36:50.892000",
    "updated_date": "2026-04-06T19:36:50.892000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ea",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b96318a1d8b625ff3b8d76",
    "id": "69d40b50fc7e6b9aa4b7409e",
    "created_date": "2026-04-06T19:36:48.358000",
    "updated_date": "2026-04-06T19:36:48.358000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ec",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "69d40b39b15a2ef2058a5916",
    "created_date": "2026-04-06T19:36:25.959000",
    "updated_date": "2026-04-06T19:36:25.959000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ea",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "69d40b3802a98741db30ded6",
    "created_date": "2026-04-06T19:36:24.091000",
    "updated_date": "2026-04-06T19:36:24.091000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ec",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8974057f9b92f893ef25b",
    "id": "69d40b14dc0904eae5887a51",
    "created_date": "2026-04-06T19:35:48.372000",
    "updated_date": "2026-04-06T19:35:48.373000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ea",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8974057f9b92f893ef25b",
    "id": "69d40b124b6fc2883688efb5",
    "created_date": "2026-04-06T19:35:46.286000",
    "updated_date": "2026-04-06T19:35:46.286000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ea",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "69d40b03d33a62f11da0e576",
    "created_date": "2026-04-06T19:35:31.073000",
    "updated_date": "2026-04-06T19:35:31.073000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ec",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "69d40b0108fe3b97c0c16734",
    "created_date": "2026-04-06T19:35:29.148000",
    "updated_date": "2026-04-06T19:35:29.148000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ea",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69bb3b459e926a73240d1dcc",
    "id": "69d40af3ef8b28e76f266781",
    "created_date": "2026-04-06T19:35:15.862000",
    "updated_date": "2026-04-06T19:35:15.862000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ec",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69bb3b459e926a73240d1dcc",
    "id": "69d40af1a20246aadc07112d",
    "created_date": "2026-04-06T19:35:13.165000",
    "updated_date": "2026-04-06T19:35:13.165000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ed",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69bb3b459e926a73240d1dcc",
    "id": "69d40aeb620830255affbac7",
    "created_date": "2026-04-06T19:35:07.219000",
    "updated_date": "2026-04-06T19:35:07.219000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b79d7b845ae3c30234550e",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b9577cf3a6a0ded97ac5df",
    "id": "69d40ad11662c3a7ddbe9e93",
    "created_date": "2026-04-06T19:34:41.874000",
    "updated_date": "2026-04-06T19:34:41.874000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ed",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b9577cf3a6a0ded97ac5df",
    "id": "69d40aca8e96d65a00bada98",
    "created_date": "2026-04-06T19:34:34.326000",
    "updated_date": "2026-04-06T19:34:34.326000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ea",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b94f648e7201c8b0270c52",
    "id": "69d40a9d656f6c61d5e703a7",
    "created_date": "2026-04-06T19:33:49.607000",
    "updated_date": "2026-04-06T19:33:49.607000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ec",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b94f648e7201c8b0270c52",
    "id": "69d40a9b00f114fa38319abe",
    "created_date": "2026-04-06T19:33:47.531000",
    "updated_date": "2026-04-06T19:33:47.531000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ec",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "69d40a7532c2eb179a088262",
    "created_date": "2026-04-06T19:33:09.452000",
    "updated_date": "2026-04-06T19:33:09.452000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ea",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "69d40a72c861c8357a9d0f80",
    "created_date": "2026-04-06T19:33:06.951000",
    "updated_date": "2026-04-06T19:33:06.951000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ed",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "69cc7f52971f97021f60ebaa",
    "created_date": "2026-04-01T02:13:38.142000",
    "updated_date": "2026-04-01T02:13:38.142000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ed",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "69cc7f48614c7aa2dfd50587",
    "created_date": "2026-04-01T02:13:28.843000",
    "updated_date": "2026-04-01T02:13:28.843000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ed",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8974057f9b92f893ef25b",
    "id": "69cc7f414e137298fbbc8348",
    "created_date": "2026-04-01T02:13:21.903000",
    "updated_date": "2026-04-01T02:13:21.903000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ed",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b943f5f7eb7bf2ca8a5463",
    "id": "69cb06c4412c0eeefbc7db38",
    "created_date": "2026-03-30T23:27:00.798000",
    "updated_date": "2026-03-30T23:27:00.798000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ed",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b94f648e7201c8b0270c52",
    "id": "69cb06b581613ba3948dc6e7",
    "created_date": "2026-03-30T23:26:45.970000",
    "updated_date": "2026-03-30T23:26:45.970000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b1b8220e1ed3484432c7ed",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "69c4c38adc398eaab8db7553",
    "created_date": "2026-03-26T05:26:34.327000",
    "updated_date": "2026-03-26T05:26:34.327000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69b79d7b845ae3c30234550e",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "69c4c3821bbc3f055c9e5511",
    "created_date": "2026-03-26T05:26:26.898000",
    "updated_date": "2026-03-26T05:26:26.898000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69bb48fc055dae9afb83104e",
    "id": "69bb5518777d65b4ae824cc8",
    "created_date": "2026-03-19T01:44:56.867000",
    "updated_date": "2026-03-19T01:44:56.867000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69bb4c87223307752e5badca",
    "id": "69bb550f2a1a98f946a728c9",
    "created_date": "2026-03-19T01:44:47.003000",
    "updated_date": "2026-03-19T01:44:47.003000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69bb3b459e926a73240d1dcc",
    "id": "69bb3f29b296a3ff2ef80023",
    "created_date": "2026-03-19T00:11:21.293000",
    "updated_date": "2026-03-19T00:11:21.293000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8a999f9543e60706ef319",
    "id": "69bb3229b259cef54d54a69a",
    "created_date": "2026-03-18T23:15:53.779000",
    "updated_date": "2026-03-18T23:15:53.779000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b95ea7e3adf7f8a5f0125c",
    "id": "69bb322207ebaa7dad7409d3",
    "created_date": "2026-03-18T23:15:46.287000",
    "updated_date": "2026-03-18T23:15:46.287000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b96318a1d8b625ff3b8d76",
    "id": "69bb321acd6d8b8334aaef5e",
    "created_date": "2026-03-18T23:15:38.561000",
    "updated_date": "2026-03-18T23:15:38.561000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8974057f9b92f893ef25b",
    "id": "69bb31fb9363b57c34107394",
    "created_date": "2026-03-18T23:15:07.601000",
    "updated_date": "2026-03-18T23:15:07.601000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8aed973da2c39291b69e2",
    "id": "69bb31e64eddc0c6197eb95c",
    "created_date": "2026-03-18T23:14:46.922000",
    "updated_date": "2026-03-18T23:14:46.922000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b9577cf3a6a0ded97ac5df",
    "id": "69bb31b025ee3154e01d6872",
    "created_date": "2026-03-18T23:13:52.103000",
    "updated_date": "2026-03-18T23:13:52.103000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b89795355340c9ea213b51",
    "id": "69bb31a735d5025e8b02408b",
    "created_date": "2026-03-18T23:13:43.138000",
    "updated_date": "2026-03-18T23:13:43.138000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b8ca2f14813bbce41ca198",
    "id": "69bb319ad9fe60ecd25b3ccb",
    "created_date": "2026-03-18T23:13:30.470000",
    "updated_date": "2026-03-18T23:13:30.470000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b943f5f7eb7bf2ca8a5463",
    "id": "69bb31917f6f6b2467c7589d",
    "created_date": "2026-03-18T23:13:21.655000",
    "updated_date": "2026-03-18T23:13:21.655000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b945c331d9f3661199283a",
    "id": "69bb318654429ea11e864fd0",
    "created_date": "2026-03-18T23:13:10.812000",
    "updated_date": "2026-03-18T23:13:10.812000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b94f648e7201c8b0270c52",
    "id": "69bb3180ef03ce04269031c4",
    "created_date": "2026-03-18T23:13:04.645000",
    "updated_date": "2026-03-18T23:13:04.645000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b93ac1adf5acbd6baf62ce",
    "id": "69bb317b2290e3475fcb2211",
    "created_date": "2026-03-18T23:12:59.354000",
    "updated_date": "2026-03-18T23:12:59.354000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b1b67e54a545c4d25ee42b",
    "id": "69bb30d2c1461992b2eaa66e",
    "created_date": "2026-03-18T23:10:10.181000",
    "updated_date": "2026-03-18T23:10:10.181000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "badge_id": "69bb2ba9ce6299ef9855afba",
    "granted_by_admin": "gustavo54hs@gmail.com",
    "note": "",
    "user_id": "69b893cea2786ffc06731c7e",
    "id": "69bb2df8d9fe60ecd25b3831",
    "created_date": "2026-03-18T22:58:00.728000",
    "updated_date": "2026-03-18T22:58:00.728000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  }
];

// 7. Exported Friend Requests
const defaultFriendRequests = [
  {
    "sender_user_id": "6a21e5b9ea5747858cb65a5c",
    "receiver_user_id": "69b89795355340c9ea213b51",
    "status": "accepted",
    "id": "6a21e6530a39784e45122795",
    "created_date": "2026-06-04T20:55:47.726000",
    "updated_date": "2026-06-04T21:10:31.642000",
    "created_by_id": "6a21e5b9ea5747858cb65a5c",
    "created_by": "wallacenicholas84@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b89795355340c9ea213b51",
    "receiver_user_id": "6a07987ba6a9ad61f91d8ff6",
    "status": "accepted",
    "id": "6a1ce3b2ff5f404fb9352c3c",
    "created_date": "2026-06-01T01:43:14.456000",
    "updated_date": "2026-06-22T03:27:58.630000",
    "created_by_id": "69b89795355340c9ea213b51",
    "created_by": "jvbarcelos15@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69e161985aad56073da40926",
    "receiver_user_id": "69b1b67e54a545c4d25ee42b",
    "status": "accepted",
    "id": "6a15c1e8755291eb82eea9e7",
    "created_date": "2026-05-26T15:53:12.955000",
    "updated_date": "2026-06-02T15:32:48.112000",
    "created_by_id": "69e161985aad56073da40926",
    "created_by": "rnh.1694@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69e161985aad56073da40926",
    "receiver_user_id": "69b893cea2786ffc06731c7e",
    "status": "accepted",
    "id": "6a15c1313269fe7fa842ea9d",
    "created_date": "2026-05-26T15:50:09.442000",
    "updated_date": "2026-05-29T03:13:21.593000",
    "created_by_id": "69e161985aad56073da40926",
    "created_by": "rnh.1694@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "6a0792641ed3fc0ebf62dd04",
    "receiver_user_id": "6a069634310e4b1e4e0c6d84",
    "status": "accepted",
    "id": "6a0792dcabfb2d0cc8b788ae",
    "created_date": "2026-05-15T21:40:44.739000",
    "updated_date": "2026-05-15T21:41:12.955000",
    "created_by_id": "6a0792641ed3fc0ebf62dd04",
    "created_by": "flygon100.al@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b89795355340c9ea213b51",
    "receiver_user_id": "69b8a999f9543e60706ef319",
    "status": "pending",
    "id": "69c49989cf02e61670e39866",
    "created_date": "2026-03-26T02:27:21.077000",
    "updated_date": "2026-03-26T02:27:21.077000",
    "created_by_id": "69b89795355340c9ea213b51",
    "created_by": "jvbarcelos15@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b8a999f9543e60706ef319",
    "receiver_user_id": "69b893cea2786ffc06731c7e",
    "status": "accepted",
    "id": "69bb52314d0db4d602491d69",
    "created_date": "2026-03-19T01:32:33.489000",
    "updated_date": "2026-03-19T04:35:30.587000",
    "created_by_id": "69b8a999f9543e60706ef319",
    "created_by": "pikadasgalaxias1620@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b8a999f9543e60706ef319",
    "receiver_user_id": "69b9577cf3a6a0ded97ac5df",
    "status": "accepted",
    "id": "69bb522745447a4ddeedd61e",
    "created_date": "2026-03-19T01:32:23.499000",
    "updated_date": "2026-03-20T09:11:49.987000",
    "created_by_id": "69b8a999f9543e60706ef319",
    "created_by": "pikadasgalaxias1620@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69bb3b459e926a73240d1dcc",
    "receiver_user_id": "69b8aed973da2c39291b69e2",
    "status": "pending",
    "id": "69bb4bdb8ae04c8c42b342f6",
    "created_date": "2026-03-19T01:05:31.921000",
    "updated_date": "2026-03-19T01:05:31.921000",
    "created_by_id": "69bb3b459e926a73240d1dcc",
    "created_by": "anna1bressan@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69bb3b459e926a73240d1dcc",
    "receiver_user_id": "69b893cea2786ffc06731c7e",
    "status": "accepted",
    "id": "69bb4bd509c010b4b4954436",
    "created_date": "2026-03-19T01:05:25.375000",
    "updated_date": "2026-03-19T04:35:31.920000",
    "created_by_id": "69bb3b459e926a73240d1dcc",
    "created_by": "anna1bressan@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69bb3b459e926a73240d1dcc",
    "receiver_user_id": "69b1b67e54a545c4d25ee42b",
    "status": "accepted",
    "id": "69bb4bce6f6322a46e7419a9",
    "created_date": "2026-03-19T01:05:18.764000",
    "updated_date": "2026-03-19T01:40:59.775000",
    "created_by_id": "69bb3b459e926a73240d1dcc",
    "created_by": "anna1bressan@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69bb3b459e926a73240d1dcc",
    "receiver_user_id": "69b8ca2f14813bbce41ca198",
    "status": "pending",
    "id": "69bb4bc7264467d111528d88",
    "created_date": "2026-03-19T01:05:11.553000",
    "updated_date": "2026-03-19T01:05:11.553000",
    "created_by_id": "69bb3b459e926a73240d1dcc",
    "created_by": "anna1bressan@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69bb3b459e926a73240d1dcc",
    "receiver_user_id": "69b8974057f9b92f893ef25b",
    "status": "accepted",
    "id": "69bb4bbae7ef7cf941fbfddc",
    "created_date": "2026-03-19T01:04:58.302000",
    "updated_date": "2026-03-31T04:14:42.499000",
    "created_by_id": "69bb3b459e926a73240d1dcc",
    "created_by": "anna1bressan@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69bb3b459e926a73240d1dcc",
    "receiver_user_id": "69b8a999f9543e60706ef319",
    "status": "pending",
    "id": "69bb4bb35d7b1f98d4afeb15",
    "created_date": "2026-03-19T01:04:51.097000",
    "updated_date": "2026-03-19T01:04:51.097000",
    "created_by_id": "69bb3b459e926a73240d1dcc",
    "created_by": "anna1bressan@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69bb48fc055dae9afb83104e",
    "receiver_user_id": "69b1b67e54a545c4d25ee42b",
    "status": "accepted",
    "id": "69bb4957404b892f1a6a78ae",
    "created_date": "2026-03-19T00:54:47.560000",
    "updated_date": "2026-03-19T01:41:01.259000",
    "created_by_id": "69bb48fc055dae9afb83104e",
    "created_by": "vitornva6@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b1b67e54a545c4d25ee42b",
    "receiver_user_id": "69b8ca2f14813bbce41ca198",
    "status": "pending",
    "id": "69bb3b422a34e00a6004096c",
    "created_date": "2026-03-18T23:54:42.437000",
    "updated_date": "2026-03-18T23:54:42.437000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b1b67e54a545c4d25ee42b",
    "receiver_user_id": "69b943f5f7eb7bf2ca8a5463",
    "status": "pending",
    "id": "69bb3ae932b068aa6c7e23b1",
    "created_date": "2026-03-18T23:53:13.092000",
    "updated_date": "2026-03-18T23:53:13.092000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b1b67e54a545c4d25ee42b",
    "receiver_user_id": "69b94f648e7201c8b0270c52",
    "status": "accepted",
    "id": "69bb3ae39fcfa1f5cde9c232",
    "created_date": "2026-03-18T23:53:07.564000",
    "updated_date": "2026-03-21T19:42:20.385000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b1b67e54a545c4d25ee42b",
    "receiver_user_id": "69b9577cf3a6a0ded97ac5df",
    "status": "accepted",
    "id": "69bb3ae0bf9992e776ce8742",
    "created_date": "2026-03-18T23:53:04.820000",
    "updated_date": "2026-03-20T09:11:51.732000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b1b67e54a545c4d25ee42b",
    "receiver_user_id": "69b96318a1d8b625ff3b8d76",
    "status": "pending",
    "id": "69bb3adc06bd04cc53fec929",
    "created_date": "2026-03-18T23:53:00.192000",
    "updated_date": "2026-03-18T23:53:00.192000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b1b67e54a545c4d25ee42b",
    "receiver_user_id": "69b89795355340c9ea213b51",
    "status": "accepted",
    "id": "69bb3ad7cef8f6bb722eebd6",
    "created_date": "2026-03-18T23:52:55.551000",
    "updated_date": "2026-03-21T06:03:32.690000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b1b67e54a545c4d25ee42b",
    "receiver_user_id": "69b8a999f9543e60706ef319",
    "status": "accepted",
    "id": "69bb3aa24a0842c050f44a31",
    "created_date": "2026-03-18T23:52:02.728000",
    "updated_date": "2026-03-19T01:31:58.518000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b8974057f9b92f893ef25b",
    "receiver_user_id": "69b1b67e54a545c4d25ee42b",
    "status": "accepted",
    "id": "69bb3a22843faca221b7aa4b",
    "created_date": "2026-03-18T23:49:54.022000",
    "updated_date": "2026-03-18T23:51:48.473000",
    "created_by_id": "69b8974057f9b92f893ef25b",
    "created_by": "mesi.abreu@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b8974057f9b92f893ef25b",
    "receiver_user_id": "69b893cea2786ffc06731c7e",
    "status": "accepted",
    "id": "69bb3a19316108a8f4cc3aad",
    "created_date": "2026-03-18T23:49:45.429000",
    "updated_date": "2026-03-18T23:50:03.670000",
    "created_by_id": "69b8974057f9b92f893ef25b",
    "created_by": "mesi.abreu@gmail.com",
    "is_sample": false
  },
  {
    "sender_user_id": "69b1b67e54a545c4d25ee42b",
    "receiver_user_id": "69b893cea2786ffc06731c7e",
    "status": "accepted",
    "id": "69bb329dace74b4de0557fcc",
    "created_date": "2026-03-18T23:17:49.355000",
    "updated_date": "2026-03-18T23:17:55.354000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  }
];

// 8. Exported Landing Page Configurations
const defaultLandingConfig = [
  {
    "title_font_url": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/31da09d12_Reglisse.otf",
    "gradient_from": "#0f2566",
    "title_size": "",
    "hero_tagline": "",
    "cta_title": "",
    "cta_button_text": "",
    "hero_subtitle": "",
    "features_title": "",
    "body_font_url": "",
    "gradient_mid": "#1d4ed8",
    "hero_title": "",
    "gradient_to": "#3b82f6",
    "subtitle_size": "",
    "cta_description": "",
    "news_section_title": "",
    "title_font_name": "Reglisse",
    "subtitle_font_name": "Valentine Delight",
    "features_subtitle": "",
    "body_font_name": "",
    "subtitle_font_url": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/e8e1a918b_ValentineDelight.otf",
    "hero_description": "",
    "id": "69b77299d520f16d8418ad69",
    "created_date": "2026-03-16T03:01:45.861000",
    "updated_date": "2026-03-16T03:44:08.486000",
    "created_by_id": "69b1b67e54a545c4d25ee42b",
    "created_by": "gustavo54hs@gmail.com",
    "is_sample": false
  }
];

// Initialize all entities proxy/helper
const entitiesList = {
  Badge: new LocalEntity("Badge", defaultBadges),
  PublicProfile: new LocalEntity("PublicProfile", defaultProfiles),
  ClubHub: new LocalEntity("ClubHub", defaultClubHub),
  ClubNews: new LocalEntity("ClubNews", defaultClubNews),
  ClubLink: new LocalEntity("ClubLink", defaultClubLinks),
  UserBadge: new LocalEntity("UserBadge", defaultUserBadges),
  FriendRequest: new LocalEntity("FriendRequest", defaultFriendRequests),
  LandingConfig: new LocalEntity("LandingConfig", defaultLandingConfig)
};

// Database Auth handler
const getSessionUser = () => {
  const session = localStorage.getItem("ckpnt_session");
  if (session) {
    return JSON.parse(session);
  }
  const defaultAdmin = {
  "role": "admin",
  "profile_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/mp/public/69b1b67e54a545c4d25ee42a/61b67dd6b_awratfawrawtawerawt.png",
  "username": "viradoembraco",
  "featured_badges": "[\"69b1b8220e1ed3484432c7ed\",\"69b1b8220e1ed3484432c7ea\",\"69fc90c71e265f09c2e0ef30\",\"6a0e8d658609debd2366d2f3\"]",
  "cover_image": "https://base44.app/api/apps/69b1b67e54a545c4d25ee42a/files/public/69b1b67e54a545c4d25ee42a/b7f970765_5.png",
  "bio": "Animado para jogar com todos!",
  "instagram": "gustavohenrique54",
  "discord": "gugonico",
  "steam": "https://steamcommunity.com/id/gugarossauro",
  "psn_username": "Gugahsouza",
  "xbox_username": "Gugolho",
  "display_name": "Gustavo Henrique",
  "id": "69b1b67e54a545c4d25ee42b",
  "created_date": "2026-03-11T18:37:50.360000",
  "updated_date": "2026-05-21T19:47:10.623000",
  "email": "gustavo54hs@gmail.com",
  "full_name": "Gustavo Henrique",
  "disabled": "",
  "disabled_reason": "",
  "is_verified": true,
  "force_password_reset": false,
  "app_id": "69b1b67e54a545c4d25ee42a",
  "is_service": false,
  "collaborator_role": "editor",
  "_app_role": "admin"
};
  localStorage.setItem("ckpnt_session", JSON.stringify(defaultAdmin));
  return defaultAdmin;
};

export const db = {
  auth: {
    isAuthenticated: async () => {
      return getSessionUser() !== null;
    },
    me: async () => {
      const user = getSessionUser();
      if (!user) return null;
      // Sync with profile info in local storage
      const profiles = entitiesList.PublicProfile.getAll();
      const profile = profiles.find(p => p.user_id === user.id);
      if (profile) {
        return {
          ...user,
          display_name: profile.display_name,
          profile_image: profile.profile_image,
          cover_image: profile.cover_image,
          about: profile.about,
          favorite_consoles: profile.favorite_consoles,
          favorite_genres: profile.favorite_genres,
          score: profile.score
        };
      }
      return user;
    },
    updateMe: async (data) => {
      const user = getSessionUser();
      if (!user) return null;
      const profiles = entitiesList.PublicProfile.getAll();
      const profile = profiles.find(p => p.user_id === user.id);
      if (profile) {
        const updatedProfile = { ...profile, ...data };
        const newProfiles = profiles.map(p => p.id === profile.id ? updatedProfile : p);
        entitiesList.PublicProfile.saveAll(newProfiles);
        
        const updatedUser = {
          ...user,
          display_name: updatedProfile.display_name,
          profile_image: updatedProfile.profile_image,
          cover_image: updatedProfile.cover_image
        };
        localStorage.setItem("ckpnt_session", JSON.stringify(updatedUser));
        return updatedUser;
      }
      return user;
    },
    logout: async () => {
      localStorage.removeItem("ckpnt_session");
      return { success: true };
    },
    redirectToLogin: (fromUrl) => {
      console.log("Redirecting to mock login... auto-logging in default admin.");
      getSessionUser();
      window.location.reload();
    }
  },
  entities: new Proxy({}, {
    get: (target, name) => {
      if (!entitiesList[name]) {
        // Create custom entity dynamically on demand
        entitiesList[name] = new LocalEntity(name);
      }
      return entitiesList[name];
    }
  }),
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const url = URL.createObjectURL(file);
        return { file_url: url };
      }
    }
  }
};

export const base44 = db;
export default db;
