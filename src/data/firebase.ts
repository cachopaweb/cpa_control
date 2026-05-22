import type { BettingHouse, Goal, Invite, ThemeMode, UserProfile } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

type FirebaseServices = {
  auth: import('firebase/auth').Auth;
  db: import('firebase/firestore').Firestore;
  storage: import('firebase/storage').FirebaseStorage;
  authModule: typeof import('firebase/auth');
  firestoreModule: typeof import('firebase/firestore');
};

export type AuthSession = {
  uid: string;
  email: string | null;
};

let servicesPromise: Promise<FirebaseServices | null> | null = null;

export function getFirebaseServices() {
  if (!isFirebaseConfigured) return Promise.resolve(null);

  servicesPromise ??= loadFirebaseServices();
  return servicesPromise;
}

async function loadFirebaseServices(): Promise<FirebaseServices> {
  const [{ initializeApp, getApps }, authModule, firestoreModule, storageModule] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
    import('firebase/storage'),
  ]);

  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

  return {
    auth: authModule.getAuth(app),
    db: firestoreModule.getFirestore(app),
    storage: storageModule.getStorage(app),
    authModule,
    firestoreModule,
  };
}

export async function subscribeToAuthProfile(
  onChange: (session: AuthSession | null, profile: UserProfile | null, error?: string) => void,
) {
  const services = await getFirebaseServices();
  if (!services) return () => undefined;

  const { auth, authModule, db, firestoreModule } = services;

  return authModule.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange(null, null);
      return;
    }

    const profileRef = firestoreModule.doc(db, 'users', user.uid);
    const profileSnap = await firestoreModule.getDoc(profileRef);
    const session = { uid: user.uid, email: user.email };

    if (!profileSnap.exists()) {
      onChange(session, null, 'Usuário autenticado, mas sem perfil no Firestore. Crie o primeiro admin ou aceite um convite.');
      return;
    }

    onChange(session, { id: user.uid, ...(profileSnap.data() as Omit<UserProfile, 'id'>) });
  });
}

export async function loginWithEmail(email: string, password: string) {
  const services = await getFirebaseServices();
  if (!services) return;

  await services.authModule.signInWithEmailAndPassword(services.auth, email, password);
}

export async function logoutFromFirebase() {
  const services = await getFirebaseServices();
  if (!services) return;

  await services.authModule.signOut(services.auth);
}

export async function createFirstAdminProfile({
  name,
  organizationName,
  email,
  password,
  themeMode,
}: {
  name: string;
  organizationName: string;
  email: string;
  password: string;
  themeMode: ThemeMode;
}) {
  const services = await getFirebaseServices();
  if (!services) throw new Error('Firebase não está configurado.');

  const { auth, authModule, db, firestoreModule } = services;
  const credential = await authModule.createUserWithEmailAndPassword(auth, email, password);
  const organizationId = `org-${credential.user.uid}`;

  await Promise.all([
    firestoreModule.setDoc(firestoreModule.doc(db, 'organizations', organizationId), {
      name: organizationName,
      status: 'trialing',
      plan: 'starter',
      ownerUserId: credential.user.uid,
      createdAt: firestoreModule.serverTimestamp(),
      updatedAt: firestoreModule.serverTimestamp(),
    }),
    firestoreModule.setDoc(firestoreModule.doc(db, 'users', credential.user.uid), {
      organizationId,
      name,
      email,
      role: 'controller',
      status: 'active',
      createdAt: firestoreModule.serverTimestamp(),
      updatedAt: firestoreModule.serverTimestamp(),
      createdBy: credential.user.uid,
      settings: { themeMode },
    }),
  ]);

  return {
    id: credential.user.uid,
    organizationId,
    name,
    email,
    role: 'controller',
    status: 'active',
  } satisfies UserProfile;
}

export async function createInviteDocument(profile: UserProfile, invite: Invite) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.addDoc(firestoreModule.collection(db, 'invites'), {
    organizationId: profile.organizationId,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    tokenHash: 'demo-client-token-hash-use-cloud-function-in-production',
    link: invite.link,
    expiresAt: new Date(`${invite.expiresAt}T23:59:59`),
    createdBy: profile.id,
    createdAt: firestoreModule.serverTimestamp(),
    acceptedAt: null,
    acceptedBy: null,
  });
}

export async function createGoalDocument(profile: UserProfile, goal: Goal) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.addDoc(firestoreModule.collection(db, 'goals'), {
    organizationId: profile.organizationId,
    title: goal.title,
    scope: goal.scope,
    metric: goal.metric,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
    progressPercent: Math.min((goal.currentValue / goal.targetValue) * 100, 100),
    period: goal.period,
    periodStart: new Date('2026-05-01T00:00:00'),
    periodEnd: new Date('2026-05-31T23:59:59'),
    status: 'active',
    createdBy: profile.id,
    createdAt: firestoreModule.serverTimestamp(),
    updatedAt: firestoreModule.serverTimestamp(),
  });
}

export async function createBettingHouseDocument(profile: UserProfile, house: BettingHouse) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.addDoc(firestoreModule.collection(db, 'bettingHouses'), {
    organizationId: profile.organizationId,
    name: house.name,
    website: house.website ?? null,
    logoUrl: null,
    notes: null,
    status: house.status,
    activeOperations: 0,
    deposit: 0,
    returns: 0,
    profit: 0,
    roi: 0,
    createdBy: profile.id,
    createdAt: firestoreModule.serverTimestamp(),
    updatedAt: firestoreModule.serverTimestamp(),
  });
}

export async function subscribeOrganizationLists(
  organizationId: string,
  onInvites: (invites: Invite[]) => void,
  onGoals: (goals: Goal[]) => void,
  onHouses: (houses: BettingHouse[]) => void,
) {
  const services = await getFirebaseServices();
  if (!services) return () => undefined;

  const { db, firestoreModule } = services;
  const invitesQuery = firestoreModule.query(
    firestoreModule.collection(db, 'invites'),
    firestoreModule.where('organizationId', '==', organizationId),
  );
  const goalsQuery = firestoreModule.query(
    firestoreModule.collection(db, 'goals'),
    firestoreModule.where('organizationId', '==', organizationId),
  );
  const housesQuery = firestoreModule.query(
    firestoreModule.collection(db, 'bettingHouses'),
    firestoreModule.where('organizationId', '==', organizationId),
  );

  const unsubscribeInvites = firestoreModule.onSnapshot(invitesQuery, (snapshot) => {
    onInvites(
      snapshot.docs.map((inviteDoc) => {
        const data = inviteDoc.data();
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate().toISOString().slice(0, 10) : '2026-05-29';

        return {
          id: inviteDoc.id,
          email: data.email ?? '',
          role: data.role ?? 'operator',
          status: data.status ?? 'pending',
          link: data.link ?? '',
          expiresAt,
        };
      }),
    );
  });

  const unsubscribeGoals = firestoreModule.onSnapshot(goalsQuery, (snapshot) => {
    onGoals(
      snapshot.docs.map((goalDoc) => {
        const data = goalDoc.data();

        return {
          id: goalDoc.id,
          title: data.title ?? 'Meta',
          scope: data.scope ?? 'organization',
          metric: data.metric ?? 'profit',
          targetValue: Number(data.targetValue ?? 0),
          currentValue: Number(data.currentValue ?? 0),
          period: data.period ?? 'Período atual',
        };
      }),
    );
  });

  const unsubscribeHouses = firestoreModule.onSnapshot(housesQuery, (snapshot) => {
    onHouses(
      snapshot.docs.map((houseDoc) => {
        const data = houseDoc.data();

        return {
          id: houseDoc.id,
          organizationId: data.organizationId ?? organizationId,
          name: data.name ?? 'Casa',
          website: data.website ?? undefined,
          status: data.status ?? 'active',
          activeOperations: Number(data.activeOperations ?? 0),
          deposit: Number(data.deposit ?? 0),
          returns: Number(data.returns ?? 0),
          profit: Number(data.profit ?? 0),
          roi: Number(data.roi ?? 0),
        };
      }),
    );
  });

  return () => {
    unsubscribeInvites();
    unsubscribeGoals();
    unsubscribeHouses();
  };
}
