import type { BettingHouse, Cycle, Goal, Invite, Operation, ThemeMode, UserProfile } from './types';

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
  storageModule: typeof import('firebase/storage');
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
    storageModule,
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

export async function loginWithGoogle() {
  const services = await getFirebaseServices();
  if (!services) return;

  const provider = new services.authModule.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await services.authModule.signInWithPopup(services.auth, provider);
}

export async function acceptInviteWithPassword({
  inviteId,
  name,
  email,
  password,
}: {
  inviteId: string;
  name: string;
  email: string;
  password: string;
}) {
  const services = await getFirebaseServices();
  if (!services) throw new Error('Firebase não está configurado.');

  const { auth, authModule, db, firestoreModule } = services;
  const credential = await authModule.createUserWithEmailAndPassword(auth, email, password);
  const inviteRef = firestoreModule.doc(db, 'invites', inviteId);

  try {
    const inviteSnap = await firestoreModule.getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      throw new Error('Convite não encontrado.');
    }

    const invite = inviteSnap.data();
    const expiresAt = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : null;

    if (invite.status !== 'pending') {
      throw new Error('Este convite não está mais disponível.');
    }

    if (invite.email !== email) {
      throw new Error('Use o mesmo email que recebeu o convite.');
    }

    if (expiresAt && expiresAt.getTime() < Date.now()) {
      throw new Error('Este convite expirou.');
    }

    const batch = firestoreModule.writeBatch(db);
    batch.set(firestoreModule.doc(db, 'users', credential.user.uid), {
      organizationId: invite.organizationId,
      name,
      email,
      role: invite.role ?? 'operator',
      status: 'active',
      createdAt: firestoreModule.serverTimestamp(),
      updatedAt: firestoreModule.serverTimestamp(),
      createdBy: invite.createdBy ?? null,
      acceptedInviteId: inviteId,
    });
    batch.update(inviteRef, {
      status: 'accepted',
      acceptedAt: firestoreModule.serverTimestamp(),
      acceptedBy: credential.user.uid,
    });
    await batch.commit();
  } catch (error) {
    await authModule.deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
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

  await firestoreModule.setDoc(firestoreModule.doc(db, 'invites', invite.id), {
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

export async function createOperationDocument(profile: UserProfile, operation: Operation) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.setDoc(firestoreModule.doc(db, 'operations', operation.id), {
    organizationId: profile.organizationId,
    operatorId: operation.operatorId,
    operatorName: operation.operatorName,
    bettingHouseId: operation.bettingHouseId,
    bettingHouseName: operation.bettingHouseName,
    game: operation.game,
    date: operation.date,
    status: operation.status,
    depositAmount: operation.depositAmount,
    withdrawalAmount: operation.withdrawalAmount,
    totalReturn: operation.totalReturn,
    profitLoss: operation.profitLoss,
    roi: operation.roi,
    proofCount: operation.proofCount,
    createdAt: firestoreModule.serverTimestamp(),
    updatedAt: firestoreModule.serverTimestamp(),
  });
}

export async function createCycleDocument(
  profile: UserProfile,
  operation: Operation,
  cycle: Cycle,
  proofFile?: File | null,
) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule, storage, storageModule } = services;
  const cycleRef = firestoreModule.doc(db, 'cycles', cycle.id);
  let proofName = cycle.proofName ?? null;
  let proofUrl: string | null = null;
  let proofPath: string | null = null;

  if (proofFile) {
    proofName = proofFile.name;
    proofPath = `cycle-proofs/${profile.organizationId}/${operation.operatorId}/${operation.id}/${cycle.id}/${proofFile.name}`;
    const fileRef = storageModule.ref(storage, proofPath);
    await storageModule.uploadBytes(fileRef, proofFile, { contentType: proofFile.type });
    proofUrl = await storageModule.getDownloadURL(fileRef);
  }

  const updatedDeposit = operation.depositAmount + cycle.deposit;
  const updatedWithdrawal = operation.withdrawalAmount + cycle.withdrawal;
  const updatedReturn = operation.totalReturn + cycle.withdrawal + cycle.bonus;
  const updatedProfit = operation.profitLoss + cycle.result;
  const updatedRoi = updatedDeposit > 0 ? (updatedProfit / updatedDeposit) * 100 : 0;
  const updatedProofCount = operation.proofCount + (proofFile ? 1 : 0);

  const batch = firestoreModule.writeBatch(db);

  batch.set(cycleRef, {
    organizationId: profile.organizationId,
    operationId: operation.id,
    operatorId: operation.operatorId,
    bettingHouseId: operation.bettingHouseId,
    cycleNumber: cycle.cycleNumber,
    betAmount: cycle.deposit,
    deposit: cycle.deposit,
    withdrawal: cycle.withdrawal,
    bonus: cycle.bonus,
    expectedReturn: cycle.withdrawal + cycle.bonus,
    resultAmount: cycle.withdrawal + cycle.bonus,
    profitLoss: cycle.result,
    roi: cycle.roi,
    status: 'under_review',
    proofRequired: true,
    proofCount: proofFile ? 1 : 0,
    proofName,
    createdAt: firestoreModule.serverTimestamp(),
    updatedAt: firestoreModule.serverTimestamp(),
  });

  if (proofFile && proofPath) {
    batch.set(firestoreModule.doc(db, 'cycleProofs', `${cycle.id}-proof`), {
      organizationId: profile.organizationId,
      cycleId: cycle.id,
      operationId: operation.id,
      operatorId: operation.operatorId,
      storagePath: proofPath,
      downloadUrl: proofUrl,
      fileName: proofFile.name,
      mimeType: proofFile.type,
      fileSize: proofFile.size,
      uploadedBy: profile.id,
      createdAt: firestoreModule.serverTimestamp(),
    });
  }

  batch.update(firestoreModule.doc(db, 'operations', operation.id), {
    depositAmount: updatedDeposit,
    withdrawalAmount: updatedWithdrawal,
    totalReturn: updatedReturn,
    profitLoss: updatedProfit,
    roi: updatedRoi,
    proofCount: updatedProofCount,
    updatedAt: firestoreModule.serverTimestamp(),
  });

  await batch.commit();
}

export async function subscribeOrganizationLists(
  organizationId: string,
  onInvites: (invites: Invite[]) => void,
  onGoals: (goals: Goal[]) => void,
  onHouses: (houses: BettingHouse[]) => void,
  onOperations: (operations: Operation[]) => void,
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
  const operationsQuery = firestoreModule.query(
    firestoreModule.collection(db, 'operations'),
    firestoreModule.where('organizationId', '==', organizationId),
  );
  const cyclesQuery = firestoreModule.query(
    firestoreModule.collection(db, 'cycles'),
    firestoreModule.where('organizationId', '==', organizationId),
  );

  let operationDocs: Operation[] = [];
  let cycleDocs: Array<Cycle & { operationId: string }> = [];

  function emitOperations() {
    const cyclesByOperation = new Map<string, Cycle[]>();

    for (const cycle of cycleDocs) {
      const current = cyclesByOperation.get(cycle.operationId);
      const cycleValue: Cycle = {
        id: cycle.id,
        cycleNumber: cycle.cycleNumber,
        deposit: cycle.deposit,
        withdrawal: cycle.withdrawal,
        bonus: cycle.bonus,
        result: cycle.result,
        roi: cycle.roi,
        proofName: cycle.proofName,
      };

      if (current) {
        current.push(cycleValue);
      } else {
        cyclesByOperation.set(cycle.operationId, [cycleValue]);
      }
    }

    onOperations(
      operationDocs.map((operation) => ({
        ...operation,
        cycles: cyclesByOperation.get(operation.id)?.toSorted((a, b) => a.cycleNumber - b.cycleNumber) ?? [],
      })),
    );
  }

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

  const unsubscribeOperations = firestoreModule.onSnapshot(operationsQuery, (snapshot) => {
    operationDocs = snapshot.docs.map((operationDoc) => {
      const data = operationDoc.data();

      return {
        id: operationDoc.id,
        organizationId: data.organizationId ?? organizationId,
        operatorId: data.operatorId ?? '',
        operatorName: data.operatorName ?? 'Operador',
        bettingHouseId: data.bettingHouseId ?? '',
        bettingHouseName: data.bettingHouseName ?? 'Casa',
        game: data.game ?? 'Aviator',
        date: data.date ?? new Date().toISOString().slice(0, 10),
        status: data.status ?? 'open',
        depositAmount: Number(data.depositAmount ?? 0),
        withdrawalAmount: Number(data.withdrawalAmount ?? 0),
        totalReturn: Number(data.totalReturn ?? 0),
        profitLoss: Number(data.profitLoss ?? 0),
        roi: Number(data.roi ?? 0),
        proofCount: Number(data.proofCount ?? 0),
        cycles: [],
      };
    });
    emitOperations();
  });

  const unsubscribeCycles = firestoreModule.onSnapshot(cyclesQuery, (snapshot) => {
    cycleDocs = snapshot.docs.map((cycleDoc) => {
      const data = cycleDoc.data();

      return {
        id: cycleDoc.id,
        operationId: data.operationId ?? '',
        cycleNumber: Number(data.cycleNumber ?? 0),
        deposit: Number(data.deposit ?? data.betAmount ?? 0),
        withdrawal: Number(data.withdrawal ?? 0),
        bonus: Number(data.bonus ?? 0),
        result: Number(data.profitLoss ?? data.result ?? 0),
        roi: Number(data.roi ?? 0),
        proofName: data.proofName ?? undefined,
      };
    });
    emitOperations();
  });

  return () => {
    unsubscribeInvites();
    unsubscribeGoals();
    unsubscribeHouses();
    unsubscribeOperations();
    unsubscribeCycles();
  };
}
