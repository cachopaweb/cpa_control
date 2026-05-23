import type { AuditLog, BettingHouse, Cycle, Goal, Invite, Operation, ThemeMode, UserProfile } from './types';

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

export type SocialAuthUser = {
  uid: string;
  email: string;
  name: string;
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

export async function getBootstrapStatus() {
  const services = await getFirebaseServices();
  if (!services) return { hasFirstAdmin: false };

  const { db, firestoreModule } = services;
  const bootstrapSnap = await firestoreModule.getDoc(firestoreModule.doc(db, 'system', 'bootstrap'));

  return {
    hasFirstAdmin: bootstrapSnap.exists() && bootstrapSnap.data().hasFirstAdmin === true,
  };
}

export async function loginWithGoogle() {
  await signInWithGoogle();
}

async function signInWithGoogle(): Promise<SocialAuthUser> {
  const services = await getFirebaseServices();
  if (!services) throw new Error('Firebase nÃ£o estÃ¡ configurado.');

  const provider = new services.authModule.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await services.authModule.signInWithPopup(services.auth, provider);
  const email = credential.user.email;

  if (!email) {
    throw new Error('A conta Google precisa ter email verificado.');
  }

  return {
    uid: credential.user.uid,
    email,
    name: credential.user.displayName ?? email.split('@')[0] ?? 'Admin CPA',
  };
}

export async function acceptInviteWithGoogle({ inviteId }: { inviteId: string }) {
  const services = await getFirebaseServices();
  if (!services) throw new Error('Firebase não está configurado.');

  const { db, firestoreModule } = services;
  const googleUser = await signInWithGoogle();
  const inviteRef = firestoreModule.doc(db, 'invites', inviteId);

  {
    const inviteSnap = await firestoreModule.getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      throw new Error('Convite não encontrado.');
    }

    const invite = inviteSnap.data();
    const expiresAt = invite.expiresAt?.toDate ? invite.expiresAt.toDate() : null;

    if (invite.status !== 'pending') {
      throw new Error('Este convite não está mais disponível.');
    }

    if (invite.email !== googleUser.email) {
      throw new Error('Use a conta Google do mesmo email que recebeu o convite.');
    }

    if (expiresAt && expiresAt.getTime() < Date.now()) {
      throw new Error('Este convite expirou.');
    }

    const batch = firestoreModule.writeBatch(db);
    batch.set(firestoreModule.doc(db, 'users', googleUser.uid), {
      organizationId: invite.organizationId,
      name: googleUser.name,
      email: googleUser.email,
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
      acceptedBy: googleUser.uid,
    });
    await batch.commit();
  }
}

export async function logoutFromFirebase() {
  const services = await getFirebaseServices();
  if (!services) return;

  await services.authModule.signOut(services.auth);
}

export async function createFirstAdminProfile({ organizationName, themeMode }: { organizationName: string; themeMode: ThemeMode }) {
  const services = await getFirebaseServices();
  if (!services) throw new Error('Firebase não está configurado.');

  const { db, firestoreModule } = services;
  const googleUser = await signInWithGoogle();
  const bootstrapRef = firestoreModule.doc(db, 'system', 'bootstrap');
  const bootstrapSnap = await firestoreModule.getDoc(bootstrapRef);

  if (bootstrapSnap.exists() && bootstrapSnap.data().hasFirstAdmin === true) {
    throw new Error('O primeiro admin ja foi cadastrado.');
  }

  const organizationId = `org-${googleUser.uid}`;
  const batch = firestoreModule.writeBatch(db);

  batch.set(firestoreModule.doc(db, 'organizations', organizationId), {
    name: organizationName,
    status: 'trialing',
    plan: 'starter',
    ownerUserId: googleUser.uid,
    createdAt: firestoreModule.serverTimestamp(),
    updatedAt: firestoreModule.serverTimestamp(),
  });
  batch.set(firestoreModule.doc(db, 'users', googleUser.uid), {
    organizationId,
    name: googleUser.name,
    email: googleUser.email,
    role: 'controller',
    status: 'active',
    createdAt: firestoreModule.serverTimestamp(),
    updatedAt: firestoreModule.serverTimestamp(),
    createdBy: googleUser.uid,
    settings: { themeMode },
  });
  batch.set(bootstrapRef, {
    hasFirstAdmin: true,
    organizationId,
    controllerUserId: googleUser.uid,
    createdAt: firestoreModule.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: googleUser.uid,
    organizationId,
    name: googleUser.name,
    email: googleUser.email,
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

  await createAuditLogDocument(profile, {
    entityType: 'invite',
    entityId: invite.id,
    action: 'invite.created',
    summary: `Convite gerado para ${invite.email}`,
    beforeData: null,
    afterData: { email: invite.email, role: invite.role, status: invite.status, expiresAt: invite.expiresAt },
  });
}

export async function createGoalDocument(profile: UserProfile, goal: Goal) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.setDoc(firestoreModule.doc(db, 'goals', goal.id), {
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

  await createAuditLogDocument(profile, {
    entityType: 'goal',
    entityId: goal.id,
    action: 'goal.created',
    summary: `Meta criada: ${goal.title}`,
    beforeData: null,
    afterData: { title: goal.title, metric: goal.metric, targetValue: goal.targetValue, period: goal.period },
  });
}

export async function createBettingHouseDocument(profile: UserProfile, house: BettingHouse) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.setDoc(firestoreModule.doc(db, 'bettingHouses', house.id), {
    organizationId: profile.organizationId,
    name: house.name,
    website: house.website ?? null,
    logoUrl: null,
    notes: house.notes ?? null,
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

  await createAuditLogDocument(profile, {
    entityType: 'betting_house',
    entityId: house.id,
    action: 'betting_house.created',
    summary: `Casa cadastrada: ${house.name}`,
    beforeData: null,
    afterData: { name: house.name, website: house.website ?? null, status: house.status },
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
    initialBalance: operation.initialBalance,
    currentBalance: operation.currentBalance,
    depositAmount: operation.depositAmount,
    withdrawalAmount: operation.withdrawalAmount,
    totalReturn: operation.totalReturn,
    profitLoss: operation.profitLoss,
    roi: operation.roi,
    proofCount: operation.proofCount,
    createdAt: firestoreModule.serverTimestamp(),
    updatedAt: firestoreModule.serverTimestamp(),
  });

  await createAuditLogDocument(profile, {
    entityType: 'operation',
    entityId: operation.id,
    action: 'operation.created',
    summary: `Operacao criada para ${operation.operatorName} na casa ${operation.bettingHouseName}`,
    beforeData: null,
    afterData: {
      operatorId: operation.operatorId,
      bettingHouseId: operation.bettingHouseId,
      game: operation.game,
      date: operation.date,
      status: operation.status,
    },
  });
}

export async function updateBettingHouseDocument(
  profile: UserProfile,
  house: Pick<BettingHouse, 'id' | 'name' | 'website' | 'notes' | 'status'>,
  beforeData?: BettingHouse,
) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.updateDoc(firestoreModule.doc(db, 'bettingHouses', house.id), {
    name: house.name,
    website: house.website ?? null,
    notes: house.notes ?? null,
    status: house.status,
    updatedAt: firestoreModule.serverTimestamp(),
  });

  await createAuditLogDocument(profile, {
    entityType: 'betting_house',
    entityId: house.id,
    action: house.status === 'inactive' ? 'betting_house.deactivated' : 'betting_house.updated',
    summary: `Casa atualizada: ${house.name}`,
    beforeData: beforeData ? { name: beforeData.name, website: beforeData.website ?? null, notes: beforeData.notes ?? null, status: beforeData.status } : null,
    afterData: { name: house.name, website: house.website ?? null, notes: house.notes ?? null, status: house.status },
  });
}

export async function updateOperatorStatusDocument(profile: UserProfile, operator: UserProfile, status: UserProfile['status']) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.updateDoc(firestoreModule.doc(db, 'users', operator.id), {
    status,
    updatedAt: firestoreModule.serverTimestamp(),
  });

  await createAuditLogDocument(profile, {
    entityType: 'user',
    entityId: operator.id,
    action: status === 'inactive' ? 'operator.deactivated' : 'operator.activated',
    summary: `${status === 'inactive' ? 'Operador desativado' : 'Operador ativado'}: ${operator.name}`,
    beforeData: { status: operator.status },
    afterData: { status },
  });
}

export async function updateOperationStatusDocument(profile: UserProfile, operation: Operation, status: Operation['status']) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;
  const nextData = {
    status,
    updatedAt: firestoreModule.serverTimestamp(),
    closedAt: status === 'closed' ? firestoreModule.serverTimestamp() : null,
  };

  await firestoreModule.updateDoc(firestoreModule.doc(db, 'operations', operation.id), nextData);

  await createAuditLogDocument(profile, {
    entityType: 'operation',
    entityId: operation.id,
    action: `operation.${status}`,
    summary: `Operacao ${status}: ${operation.bettingHouseName}`,
    beforeData: { status: operation.status },
    afterData: { status },
  });
}

export async function updateGoalStatusDocument(profile: UserProfile, goal: Goal, status: Goal['status']) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.updateDoc(firestoreModule.doc(db, 'goals', goal.id), {
    status,
    updatedAt: firestoreModule.serverTimestamp(),
  });

  await createAuditLogDocument(profile, {
    entityType: 'goal',
    entityId: goal.id,
    action: `goal.${status}`,
    summary: `Meta atualizada: ${goal.title}`,
    beforeData: { status: goal.status },
    afterData: { status },
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
  const updatedCurrentBalance = operation.initialBalance + updatedProfit;

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
    status: cycle.status,
    proofRequired: true,
    proofCount: proofFile ? 1 : 0,
    proofName,
    proofUrl,
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
    currentBalance: updatedCurrentBalance,
    proofCount: updatedProofCount,
    updatedAt: firestoreModule.serverTimestamp(),
  });

  await batch.commit();

  await createAuditLogDocument(profile, {
    entityType: 'cycle',
    entityId: cycle.id,
    action: 'cycle.created',
    summary: `Ciclo #${cycle.cycleNumber} registrado em ${operation.bettingHouseName}`,
    beforeData: null,
    afterData: {
      operationId: operation.id,
      deposit: cycle.deposit,
      withdrawal: cycle.withdrawal,
      bonus: cycle.bonus,
      result: cycle.result,
      roi: cycle.roi,
      proofName,
      proofUploaded: Boolean(proofFile),
    },
  });
}

export async function createAuditLogDocument(
  profile: UserProfile,
  log: Omit<AuditLog, 'id' | 'organizationId' | 'actorUserId' | 'actorName' | 'createdAt'>,
) {
  const services = await getFirebaseServices();
  if (!services) return;

  const { db, firestoreModule } = services;

  await firestoreModule.addDoc(firestoreModule.collection(db, 'auditLogs'), {
    organizationId: profile.organizationId,
    actorUserId: profile.id,
    actorName: profile.name,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    summary: log.summary,
    beforeData: log.beforeData ?? null,
    afterData: log.afterData ?? null,
    createdAt: firestoreModule.serverTimestamp(),
  });
}

export async function subscribeOrganizationLists(
  organizationId: string,
  onUsers: (users: UserProfile[]) => void,
  onInvites: (invites: Invite[]) => void,
  onGoals: (goals: Goal[]) => void,
  onHouses: (houses: BettingHouse[]) => void,
  onOperations: (operations: Operation[]) => void,
  onAuditLogs: (auditLogs: AuditLog[]) => void,
) {
  const services = await getFirebaseServices();
  if (!services) return () => undefined;

  const { db, firestoreModule } = services;
  const invitesQuery = firestoreModule.query(
    firestoreModule.collection(db, 'invites'),
    firestoreModule.where('organizationId', '==', organizationId),
  );
  const usersQuery = firestoreModule.query(
    firestoreModule.collection(db, 'users'),
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
  const auditLogsQuery = firestoreModule.query(
    firestoreModule.collection(db, 'auditLogs'),
    firestoreModule.where('organizationId', '==', organizationId),
    firestoreModule.orderBy('createdAt', 'desc'),
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
        status: cycle.status,
        proofName: cycle.proofName,
        proofUrl: cycle.proofUrl,
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

  const unsubscribeUsers = firestoreModule.onSnapshot(usersQuery, (snapshot) => {
    onUsers(
      snapshot.docs.map((userDoc) => {
        const data = userDoc.data();

        return {
          id: userDoc.id,
          organizationId: data.organizationId ?? organizationId,
          name: data.name ?? 'Usuario',
          email: data.email ?? '',
          role: data.role ?? 'operator',
          status: data.status ?? 'active',
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
          status: data.status ?? 'active',
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
          notes: data.notes ?? undefined,
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
        initialBalance: Number(data.initialBalance ?? 0),
        currentBalance: Number(data.currentBalance ?? data.profitLoss ?? 0),
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
        status: data.status ?? 'under_review',
        proofName: data.proofName ?? undefined,
        proofUrl: data.proofUrl ?? undefined,
      };
    });
    emitOperations();
  });

  const unsubscribeAuditLogs = firestoreModule.onSnapshot(auditLogsQuery, (snapshot) => {
    onAuditLogs(
      snapshot.docs.map((logDoc) => {
        const data = logDoc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();

        return {
          id: logDoc.id,
          organizationId: data.organizationId ?? organizationId,
          actorUserId: data.actorUserId ?? '',
          actorName: data.actorName ?? 'Sistema',
          entityType: data.entityType ?? 'operation',
          entityId: data.entityId ?? '',
          action: data.action ?? 'event.created',
          summary: data.summary ?? 'Evento registrado',
          createdAt,
          beforeData: data.beforeData ?? null,
          afterData: data.afterData ?? null,
        };
      }),
    );
  });

  return () => {
    unsubscribeInvites();
    unsubscribeUsers();
    unsubscribeGoals();
    unsubscribeHouses();
    unsubscribeOperations();
    unsubscribeCycles();
    unsubscribeAuditLogs();
  };
}
