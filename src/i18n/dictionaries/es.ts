/**
 * Diccionario base. El español es el idioma de origen: si un texto se escribe
 * primero aquí, `en.ts` deja de compilar hasta que se traduzca. Esa es la
 * mitad del sistema que evita que se cuelen textos sin traducir.
 *
 * Dos niveles de anidación, no más. El tipo de las claves se deriva de este
 * objeto, y con más niveles la inferencia se vuelve ilegible y lenta.
 */
export const es = {
  common: {
    save: "Guardar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    delete: "Eliminar",
    edit: "Editar",
    back: "Volver",
    close: "Cerrar",
    add: "Agregar",
    send: "Enviar",
    search: "Buscar",
    loading: "Cargando...",
    retry: "Reintentar",
    error: "Ocurrió un error. Inténtalo de nuevo.",
    required: "Campo obligatorio",
    optional: "opcional",
    yes: "Sí",
    no: "No",
    backToProfile: "← Volver al perfil",
    genericNetworkError: "Error de red. Inténtalo de nuevo.",
  },

  landing: {
    welcome: "Bienvenid@ a FesamedCare 👋",
    headline: "Cambiando la forma en que\nrecibes atención médica",
    subhead:
      "Aquí tú eliges especialistas certificados y con experiencia\nen el momento que lo necesitas.",
    serviceVeneers: "Carillas de porcelana",
    serviceSurgery: "Cirugías Plásticas",
    serviceImplants: "Implantes Dentales",
    ctaFindDoctor: "Encuentra un doctor",
    ctaAbout: "Sobre nosotros",

    incentivesTitle: "Miles de especialistas\ncertificados - Online",
    incentivesBody:
      "Programa una cita con un Especialista sin hacer filas, sin largas\nesperas durante una llamada.",
    incentivesHighlight: "¡Agenda tu cita en un click! ✅",
    specialtiesCount: "+25 especialidades médicas a tu disposición.",
    specialtyGeneral: "Doctor General",
    specialtyPregnancy: "Embarazo",
    specialtyOphthalmology: "Oftalmología",
    specialtyPsychiatry: "Psiquiatría",
    specialtyOther: "Otros",
    ctaCreateAccount: "Crear cuenta",
    ctaSearchSpecialist: "Buscar especialista",

    useCasesTitle: "Agendamiento en un Click\ncon Doctores Certificados",
    statSpecialists: "+ 1500 Especialistas Certificados",
    statSpecialties: "+ 25 Especialidades Médicas",
    statRecommendations: "+ 1800 Recomendaciones de Pacientes",
    statPatients: "+ 24 Mil Pacientes por año",
  },

  about: {
    eyebrow: "FesamedCare | ¿Qué hacemos? 🧐",
    titleLine1: "Transformamos la Salud,",
    titleLine2: "Mejoramos",
    typewriter1: "Sonrisas",
    typewriter2: "Bienestar",
    typewriter3: "¡Vidas!",
    body1:
      "En FesamedCare, estamos revolucionando la forma en que recibes atención médica.",
    body2:
      "Nuestro objetivo es conectar a los pacientes con especialistas certificados y experimentados en el momento que más lo necesitan.",
    body3:
      "Creemos en brindar un servicio de calidad que sea accesible y eficiente, sin las molestias de las largas esperas y las filas interminables.",
    whoAreWeTitle: "¿Quiénes somos?",
    whoAreWeBody:
      "Somos una plataforma innovadora con sede en Cali, Colombia, dedicada a mejorar la calidad de vida de las personas a través de servicios médicos y dentales de primera clase. Ofrecemos una amplia gama de especialidades, incluyendo tratamientos dentales como diseño de sonrisa e implantes dentales, así como cirugías plásticas realizadas por expertos.",
    ourBlog: "Nuestro Blog",
  },

  auth: {
    loginGreeting: "Hola, Bienvenid@ 👋",
    loginSubtitle: "¡Esperamos que estés bien!",
    emailPlaceholder: "Correo",
    passwordPlaceholder: "Contraseña",
    signIn: "Ingresar",
    signUpLink: "Registrarme",
    forgotPasswordLink: "¿Olvidaste tu contraseña?",
    orContinueWith: "También puedes ingresar con:",
    loginError: "Error al iniciar sesión",

    forgotTitle: "¿Olvidaste tu contraseña?",
    forgotSubtitle:
      "Escribe tu correo y te enviamos un enlace para crear una nueva.",
    backToSignIn: "Volver a ingresar",

    resetIncompleteTitle: "Enlace incompleto",
    resetIncompleteBody:
      "Este enlace no trae el código de recuperación. Pide uno nuevo.",
    resetRequestAnother: "Pedir otro enlace",
    resetTitle: "Crea una contraseña nueva",
    resetSubtitle: "Elige una que no hayas usado antes.",
    newPasswordPlaceholder: "Contraseña nueva",
    repeatPasswordPlaceholder: "Repite la contraseña",

    verifying: "Verificando tu correo...",
    verifiedTitle: "¡Correo verificado!",
    verifiedBody: "Tu correo electrónico ha sido verificado exitosamente.",
    goToDashboard: "Ir al dashboard",
    verifyErrorTitle: "Error de verificación",
    backToDashboard: "Volver al dashboard",
    missingToken: "No se encontró el token de verificación en el enlace.",
    invalidToken: "Token inválido o expirado.",

    createAccountTitle: "Crea una cuenta 👋",
    selectRole: "Selecciona tu rol para comenzar",
    rolePatient: "Paciente",
    rolePatientDesc: "Encuentra y agenda citas con profesionales de la salud",
    roleDoctor: "Doctor",
    roleDoctorDesc: "Gestiona tu consulta y atiende pacientes en línea",
    alreadyHaveAccount: "Iniciar Sesión",
  },

  search: {
    title: "Busca un doctor y agenda tu cita",
    subtitle: "Solo se muestran doctores con perfil verificado por Fesamed.",
    department: "Departamento",
    allDepartments: "Todos los departamentos",
    city: "Ciudad",
    allCities: "Todas las ciudades",
    specialty: "Especialidad",
    allSpecialties: "Todas las especialidades",
    queryPlaceholder: "Nombre o especialización",
    searching: "Buscando...",
    emptyTitle: "No hay doctores disponibles para mostrar.",
    emptyBody:
      "Solo aparecen perfiles de doctores que han sido aprobados por Fesamed. Si aplicaste filtros, prueba sin ellos para ver todos. Si eres doctor y no te ves, revisa que tu perfil esté enviado a verificación y aprobado.",
    resultsOne: "{count} doctor encontrado",
    resultsMany: "{count} doctores encontrados",
    viewAndBook: "Ver perfil y agendar",
    requirementsTitle: "Requisitos para aparecer en la búsqueda:",
    requirement1: "Cuenta con rol de doctor en Fesamed.",
    requirement2: "Perfil completado y enviado a verificación.",
    requirement3: "Perfil aprobado por Fesamed (revisión por el equipo).",
  },

  booking: {
    profileLoadError: "No se pudo cargar el perfil. Intenta de nuevo.",
    bookError: "No se pudo agendar. Intenta de nuevo.",
    loginAsPatient: "Inicia sesión como paciente para agendar.",
    signInLink: "Iniciar sesión",
    profileNotFound: "Perfil no encontrado.",
    backToSearch: "Volver a búsqueda",

    successTitle: "Cita agendada",
    successBody:
      "Tu cita con {doctor} ha sido registrada. Revisa tu correo para más detalles.",
    viewMyAppointments: "Ver mis citas",
    bookAnother: "Agendar otra cita",

    doctorProfileTitle: "Perfil del doctor",
    professionalCard: "Tarjeta profesional:",
    yearsExperience: "años exp.",
    aboutMe: "Sobre mí",
    specialties: "Especialidades",
    languages: "Idiomas",
    education: "Formación académica",
    services: "Servicios",
    treatedDiseases: "Enfermedades tratadas",
    insurances: "Aseguradoras aceptadas",
    certificates: "Certificados y títulos",
    certificateLabel: "Certificado {n}",
    paymentMethods: "Métodos de pago",
    officesTitle: "Consultorios ({count})",

    densityHigh: "Buena disponibilidad",
    densityLow: "Quedan pocos turnos",
    densityFull: "Sin turnos disponibles",
    slotsLeft: "{count} disponibles",
    oneSlotLeft: "1 disponible",
    bookTitle: "Agendar cita",
    pickDate: "Selecciona la fecha",
    availableSlots: "Horarios disponibles",
    noSlots: "No hay turnos para esta fecha. Elige otra.",
    confirmBooking: "Confirmar cita",
    confirming: "Confirmando...",
  },

  appointments: {
    pageTitle: "Mis citas",
    loadUserError: "No se pudo cargar tu información. Por favor inicia sesión.",
    goToLogin: "Ir al inicio de sesión",

    tabUpcoming: "Próximas",
    tabPast: "Pasadas",
    tabCanceled: "Canceladas",
    loadError: "No se pudieron cargar las citas.",
    dateUnavailable: "Fecha no disponible",
    reasonLabel: "Motivo:",

    statusPending: "Pendiente",
    statusInProcess: "En proceso",
    statusCompleted: "Completada",
    statusNoShow: "No asistió",
    statusCanceledByPatient: "Cancelada por paciente",
    statusCanceledByDoctor: "Cancelada por médico",

    actionCancel: "Cancelar",
    actionReview: "Reseñar",
    actionCheckOut: "Cerrar consulta",
    checkOutError: "No se pudo cerrar la consulta.",
    tooEarly: "Podrás registrar la llegada cuando empiece la cita.",
    windowClosed: "El plazo para registrar la llegada expiró.",
    autoClosed: "Cerrada automáticamente",
    actionCheckIn: "Check-in",
    actionNoShow: "No asistió",

    cancelDialogTitle: "Cancelar cita",
    cancelDialogBody:
      "¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.",
    cancelReasonPlaceholder: "Motivo de cancelación (opcional)",
    cancelDialogBack: "Volver",
    cancelDialogConfirm: "Confirmar cancelación",
    cancelError: "Error al cancelar la cita.",

    reviewDialogTitle: "Dejar reseña",
    reviewPrompt: "Califica tu experiencia con el médico",
    reviewCommentPlaceholder: "Comentario (opcional)",
    reviewSubmit: "Enviar reseña",
    reviewError: "Error al enviar la reseña.",

    checkInError: "Error al registrar la llegada.",
    noShowError: "Error al marcar como no asistida.",
  },

  dashboard: {
    home: "Inicio",
    profile: "Perfil",
    editProfile: "Editar Perfil",
    settings: "Configuración",
    availability: "Disponibilidad",
    help: "Ayuda y Soporte",
    terms: "Términos y Condiciones",
    logout: "Salir",
    myConsultations: "Mis consultas",
    myAppointments: "Mis citas",
    loadUserError: "No se pudo obtener la información del usuario",
    loadDataError: "Error al cargar los datos del usuario",
    logoutSuccess: "Sesión cerrada con éxito",
    logoutError: "Error al cerrar sesión",
    uploadPhotoError: "Error al subir la foto. Inténtalo de nuevo.",
    unauthorized: "No autorizado",
  },

  verification: {
    loadError: "Error al cargar",
    dismiss: "Cerrar aviso",
    collapseLabel: "Contraer aviso",
    pendingChangesTitle: "Cambios pendientes de aprobación",
    verifiedTitle: "Perfil verificado",
    underReviewTitle: "Perfil en revisión",
    rejectedTitle: "Perfil rechazado",
    pendingChangesBody:
      "Realizaste cambios en tu perfil y están siendo revisados por el equipo de Fesamed. Tu perfil aprobado anterior sigue visible para los pacientes mientras tanto.",
    viewMyChanges: "Ver mis cambios",
    underReviewBody:
      "Tu perfil ya alcanzó el 100% y está en cola de revisión. Un administrador de Fesamed lo revisará pronto.",
    underReviewNote:
      "La revisión se hace en el panel de administración de Fesamed.",
    rejectedBody:
      "Revisa tu correo y los comentarios del revisor. Corrige lo indicado y guarda de nuevo para volver a enviar.",
    editProfile: "Editar perfil",
    incompleteBody:
      "Para aparecer en la búsqueda de doctores, tu perfil debe estar al 100%.",

    email: "Correo electrónico",
    resendVerification: "Reenviar correo de verificación",
    emailSent: "Correo enviado. Revisa tu bandeja (o MailHog en local).",
    emailError: "Error al enviar el correo.",
    phone: "Número de teléfono",
    phoneHint: "En local el código aparece en los logs del backend.",
    phonePlaceholder: "+573001234567",
    enterPhone: "Ingresa tu número de teléfono.",
    codeSent:
      "Código enviado. En local, revisa los logs del backend (docker logs web).",
    codeError: "Error al enviar el código.",
    codeHint: "Ingresa el código de 6 dígitos.",
    codePlaceholder: "000000",
    enterCode: "Ingresa el código recibido.",
    phoneVerified: "¡Teléfono verificado correctamente!",
    codeIncorrect: "Código incorrecto o expirado. Intenta de nuevo.",
    verifyCodeError: "Error al verificar el código.",
    changeNumber: "Cambiar número",
  },

  contact: {
    title: "Contáctanos",
    subtitle: "¿Tienes alguna pregunta o comentario? ¡Estamos aquí para ayudarte!",
    company: "Health Services Company",
    seeSpecialists: "Ver especialistas disponibles",
    fullName: "Nombre Completo",
    email: "Correo Electrónico",
    subject: "Asunto / Motivo",
    description: "Descripción",
    budgetPlaceholder: "Selecciona un presupuesto (Opcional)",
  },

  settings: {
    title: "Configuración",
    intro: "Selecciona una opción del menú lateral para configurar tu cuenta y perfil.",
    introBody:
      "Puedes administrar tu cuenta, cambiar tu contraseña, y personalizar tu perfil desde aquí.",
    accountSecurity: "Cuenta y seguridad",
    profileVisibility: "Perfil y visibilidad",
    changePassword: "Cambiar contraseña",
    deleteAccount: "Borrar cuenta",
    searchHistory: "Historial de búsqueda",
    notifications: "Notificaciones",

    passwordIntro:
      "Asegúrate de elegir una contraseña segura para proteger tu cuenta. Usa al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y símbolos especiales.",
    currentPassword: "Ingresa tu Contraseña actual",
    newPassword: "Contraseña nueva",
    confirmPassword: "Confirmar contraseña",
    passwordMismatch: "Las contraseñas no coinciden",
    passwordChangeError: "No se pudo cambiar la contraseña.",

    deleteWarning:
      "Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos y no podrás recuperarlos.",
    deleteBody:
      "Al eliminar tu cuenta, perderás acceso a todos tus datos, incluyendo tu historial, configuraciones y preferencias.",

    notificationsIntro: "Configura cómo y cuándo quieres recibir notificaciones.",
    emailNotifications: "Notificaciones por correo electrónico",
    emailNotificationsDesc:
      "Recibe información sobre nuevas funciones y promociones",
    appNotifications: "Notificaciones en la aplicación",
    messages: "Mensajes",

    searchHistoryIntro:
      "Aquí puedes ver y administrar tu historial de búsquedas recientes.",
    removeItem: "Eliminar",
  },

  admin: {
    noPermission: "No tienes permisos para acceder al panel de administración.",
    panelTitle: "Panel de Administración",
    reviewQueue: "Cola de revisión",
    queueSubtitle:
      "Perfiles de doctores con 100% de completitud pendientes de aprobación.",
    queueEmpty: "No hay perfiles en cola de revisión",
    colDoctor: "Doctor",
    colEmail: "Correo",
    colCompletion: "Completitud",
    colStatus: "Estado",
    statusUnderReview: "En revisión",
    pagination: "Página {page} de {pages} · {total} solicitudes",
    searchPlaceholder: "Buscar por nombre o correo...",
    draftUpdated: "Última actualización del borrador",
    previousApproved: "Versión aprobada anterior",
    firstVersion: "Primera versión",
    noChangesVsApproved: "Sin cambios respecto a la versión aprobada",
    fieldDescription: "Descripción profesional",
    fieldCardNumber: "Número de tarjeta profesional",
    fieldSpecialties: "Especialidades",
    fieldLanguages: "Idiomas",
    fieldUniversities: "Universidades",
    fieldDiseases: "Enfermedades tratadas",
    fieldServices: "Servicios",
    fieldInsurances: "Seguros médicos",
    noDiff: "No se detectaron diferencias con la versión aprobada anterior.",
    decision: "Decisión",
    noSearchResults: "No se encontraron resultados para «{query}»",
    profileReview: "Revisión de perfil",
    profileNotFound: "No se encontró el perfil.",
    approved: "Perfil aprobado exitosamente. El doctor recibirá un correo de notificación.",
    rejected: "Perfil rechazado. El doctor recibirá un correo con el motivo.",
  },

  misc: {
    loadingVerification: "Cargando estado de verificación…",
    completeForVerification: "Completa tu perfil para verificación ({pct}%)",
    completeToRequest: "Completa tu perfil para solicitar verificación",
    approvedVisible:
      "Tu perfil está aprobado y visible en la búsqueda de doctores.",
    underReviewFull:
      "Tu perfil ya alcanzó el 100% y está en cola de revisión. Un administrador de Fesamed lo revisará pronto; cuando lo aprueben, aparecerás en la búsqueda de doctores.",
    incompleteFull:
      "Para aparecer en la búsqueda de doctores, tu perfil debe estar al 100%. Cuando lo completes, se enviará a revisión y un administrador lo aprobará desde el panel de Fesamed.",
    accountVerification: "Verificación de cuenta",
    emailLinkHint: "Recibirás un enlace en tu correo. En entorno local ábrelo en",
    phoneCountryHint: "Ingresa tu número con código de país (ej.",
    sendCode: "Enviar código",

    findADoctor: "Encuentra un Doctor",
    pickLocation: "Selecciona tu locación",
    searchByNamePlaceholder: "Buscar por nombre / especialización",
    reviews: "Reseñas",

    dashboardLoadError:
      "No se pudo cargar el dashboard. Por favor, inicie sesión nuevamente.",
    noAccountYet: "¿Aún no tienes una cuenta?",
    alreadyHaveAccount: "¿Ya tienes una cuenta?",
    rememberedIt: "¿Ya la recordaste?",
    needSpecialist: "¿Necesitas algún especialista?",
    acceptTermsAlert: "Por favor, acepta los términos y condiciones.",
    messageSent: "¡Mensaje enviado exitosamente!",
    messageError: "Ocurrió un error. Inténtalo nuevamente.",
    termsAndConditions: "términos y condiciones",
    privacyPolicy: "políticas de privacidad",

    personalData: "Datos personales",
    personalDataHint:
      "Estos datos los ve el profesional cuando agendas una cita con él.",
    generalInfo: "Información General",
    general: "General",

    uncategorized: "Sin categoría",
    allCategories: "Todas",
    pickCategory: "Selecciona una categoría",
    searchArticles: "Buscar Artículos...",
    noDescription: "No hay descripción disponible.",
    dateUnavailable: "Fecha no disponible",
    noPosts: "No hay publicaciones disponibles",
    selectedCount: "{count} seleccionado(s)",
    selectPlaceholder: "Seleccionar...",
    noResults: "No se encontraron resultados.",
    categoryLabel: "Categoría:",
  },

  register: {
    successTitle: "¡Registro exitoso!",
    successBody:
      "Tu cuenta ha sido creada. Te redirigiremos al inicio de sesión automáticamente.",
    goToLoginNow: "Ir a iniciar sesión ahora",
    patientTagline: "¡Estamos aquí para ayudarte!",
    doctorTagline: "¡Únete a nuestra red de profesionales!",

    firstName: "Nombre",
    lastName: "Apellido",
    email: "Correo",
    password: "Contraseña",
    phone: "Teléfono",
    searchSpecialty: "Buscar especialidad",
    insurancesOptional: "Seguros Médicos (Opcional)",
    searchInsurances: "Buscar seguros médicos",
    noInsurancesFound: "No se encontraron seguros médicos",

    ruleMinLength: "Mínimo 8 caracteres",
    ruleUppercase: "Al menos una mayúscula",
    ruleLowercase: "Al menos una minúscula",
    ruleNumber: "Al menos un número",
    ruleSpecial: "Al menos un carácter especial",
    ruleNotCommon: "No usar contraseñas comunes",
    passwordStrong: "¡Contraseña segura! Puedes continuar.",

    termsLabel: "Términos y condiciones",
    orRegisterWith: "También puedes registrarte con:",

    passwordRequirementsError:
      "Por favor, asegúrate de cumplir todos los requisitos de la contraseña",
    mustAcceptTerms: "Debes aceptar los términos y condiciones",
    invalidPhone: "Por favor, ingresa un número de teléfono válido",
    missingApiUrl: "Error de configuración: falta la URL de la API",
  },

  profile: {
    loadError: "Error al cargar el perfil",
    validationError: "Error de validación",
    minAgeDoctor: "Un profesional debe tener al menos {years} años cumplidos",
    networkSaveError: 'Error de red al guardar "{step}".',

    personalContact: "Datos personales y de contacto",
    email: "Correo electrónico",
    phone: "Teléfono",
    birthDate: "Fecha de nacimiento",
    gender: "Género",
    male: "Masculino",
    female: "Femenino",
    other: "Otro",
    pickOption: "Selecciona una opción",
    idDocument: "Cédula / Documento de identidad",
    idDocumentShort: "Documento de identidad",
    idPlaceholder: "Número de identificación",

    aboutYou: "Sobre ti",
    firstName: "Nombre",
    firstNamePlaceholder: "Ingrese su primer nombre",
    lastName: "Apellido",
    lastNamePlaceholder: "Ingrese su apellido",
    description: "Descripción",
    descriptionPlaceholder: "Escriba una breve descripción sobre usted",

    professionalInfo: "Información Profesional",
    licenseNumber: "Número de Licencia",
    licensePlaceholder: "Ingrese su número de licencia",
    education: "Educación",
    universitiesPlaceholder: "Seleccione sus universidades",
    experience: "Experiencia",
    experiencePlaceholder: "Describa su experiencia profesional",
    languages: "Idiomas",
    languagesPlaceholder: "Seleccione los idiomas que habla",

    specializationTreatments: "Especialización y tratamientos",
    specialties: "Especialidades",
    specialtiesPlaceholder: "Seleccione sus especialidades",
    treatedDiseases: "Enfermedades tratadas",
    diseaseCommentsPlaceholder: "Agregue comentarios sobre esta enfermedad",
    diseasesPlaceholder: "Seleccione las enfermedades que trata",
    services: "Servicios",
    servicesPlaceholder: "Seleccione los servicios que ofrece",

    myOffices: "Mis consultorios",
    officeInfo: "Información del consultorio",
    officeNamePlaceholder: "Ej. Consultorio Central",
    address: "Dirección *",
    addressPlaceholder: "Ej. Calle 123 # 45-67",
    pickCity: "Selecciona una ciudad",
    postalCode: "Código Postal *",
    postalPlaceholder: "Ej. 110111",
    contactInfo: "Información de Contacto",
    primaryPhone: "Teléfono primario *",
    phonePlaceholder: "Ej. +57 300 123 4567",
    secondaryPhone: "Teléfono secundario",
    secondaryPhonePlaceholder: "Número adicional (opcional)",
    website: "Sitio web o link de Google Maps",
    paymentMethods: "Métodos de Pago",
    paymentPlaceholder: "Selecciona métodos de pago",
    noPhotos: "Sin fotos. Sube imágenes de este consultorio.",
    removePhoto: "Eliminar foto",
    photosAfterSave: "Podrás subir fotos del consultorio después de guardarlo.",
    requiredFields:
      "Por favor completa los campos obligatorios: nombre, dirección, ciudad, teléfono y código postal.",
    confirmDeleteOffice: "¿Estás seguro de que deseas eliminar este consultorio?",

    uploadCertificates: "Sube tus certificados",
    uploadOfficePhotos: "Sube fotos de tus consultorios",
    dropzoneHint: "Haga clic o arrastre para cargar su archivo",
    fileTypesWithPdf: "PNG, JPG, PDF, SVG (Máximo 10 MB)",
    fileTypes: "PNG, JPG, SVG (Máximo 10 MB)",
    fileTooLarge: 'El archivo "{name}" excede el límite de 10 MB.',
    loadingImages: "Cargando imágenes...",
    existingImage: "Imagen existente",

    ruleUppercase: "Una mayúscula",
    ruleLowercase: "Una minúscula",
    ruleNumber: "Un número",
    ruleSpecial: "Un carácter especial",
    passwordChangeError: "No se pudo cambiar la contraseña.",
    saving: "Guardando...",
    savePassword: "Guardar contraseña",
  },

  ui: {
    imagePreview: "Vista previa de imagen",
    indexOf: "{current} de {total}",
    thumbnail: "Miniatura {n}",
    viewPhoto: "Ver foto",
    changePhoto: "Cambiar foto",
    changeProfilePhoto: "Cambiar foto de perfil",
    uploadingPhoto: "Subiendo...",
    photoUpdated: "Foto de perfil actualizada.",
    photoUploadError: "Error al subir la foto.",
    noPhotoYet: "Aún no tienes foto de perfil.",
    accessDenied: "Acceso denegado",
    goToDashboard: "Ir al dashboard",
    goEditProfile: "Ir a editar perfil",
    loading: "Cargando...",
    sending: "Enviando...",
    saving: "Guardando...",
    previous: "Anterior",
    selectPrompt: "Seleccione...",
    preview: "Vista previa",
    selectFiles: "Seleccionar Archivos",
    edit: "Editar",
    remove: "Eliminar",
    website: "Sitio web",
    accept: "Acepto",
    createAccount: "Crear cuenta",
    redirectingIn: "Redirigiendo en",
    noSpecialtiesFound: "No se encontraron especialidades",

    approving: "Aprobando...",
    approveProfile: "Aprobar perfil",
    rejecting: "Rechazando...",
    rejectProfile: "Rechazar perfil",
    confirmReject: "Confirmar rechazo",
    rejectReason: "Motivo del rechazo",
    rejectReasonPlaceholder:
      "Describe claramente el motivo del rechazo para que el doctor pueda corregirlo...",
    changesDetected: "Cambios detectados",
    backToQueue: "Volver a la cola",
    noData: "Sin datos",
    profilePhoto: "Foto de perfil",
    noProfilePhoto: "Sin foto de perfil",
    currentPhoto: "Foto actual",
    newPhoto: "Nueva foto",
    firstPhoto: "Primera foto",
    previousPhoto: "Foto anterior",
    certificates: "Certificados",
    newCertificate: "Nuevo certificado",
    removedCertificate: "Certificado eliminado",

    deleteAccountTitle: "Borrar cuenta",
    deleteAccountButton: "Borrar mi cuenta permanentemente",
    deleteConfirmPrompt: 'Para confirmar, escribe "BORRAR" en el campo de abajo',
    deleteConfirmWord: "BORRAR",

    notifications: "Notificaciones",
    accountActivity: "Actividad de la cuenta",
    accountActivityDesc: "Notificaciones sobre la actividad en tu cuenta",
    systemUpdates: "Actualizaciones del sistema",
    systemUpdatesDesc: "Notificaciones sobre actualizaciones y mantenimiento",
    importantUpdates: "Actualizaciones importantes",
    importantUpdatesDesc:
      "Recibe notificaciones sobre cambios importantes en tu cuenta",
    newslettersOffers: "Boletines y ofertas",
    newMessageDesc: "Notificaciones cuando recibes un nuevo mensaje",
    clearAllHistory: "Borrar todo el historial",

    loadingCertificates: "Cargando certificados...",
    noCertificates:
      "No hay certificados cargados. Sube algunos usando el formulario anterior.",
    addOffice: "Agregar consultorio",
    addFirstOffice: "Agregar tu primer consultorio",
    loadingOffices: "Cargando consultorios...",
    noOffices: "No tienes consultorios registrados.",
    offices: "Consultorios",
    loadingProfile: "Cargando tu perfil...",
    loadingYourData: "Cargando tus datos...",
    emailExamplePlaceholder: "correo@ejemplo.com",

    adjustProfilePhoto: "Ajustar foto de perfil",
    processing: "Procesando...",
    zoom: "Zoom",

    srPhone: "Número de teléfono",
    srEmail: "Correo electrónico",
    altLogo: "Logo de FesamedCare",
    altAboutUs: "Ilustración sobre nosotros",
  },

  empty: {
    upcomingTitle: "No tienes citas agendadas",
    upcomingPatientBody:
      "Cuando reserves con un especialista, la verás aquí con su fecha, su hora y el consultorio.",
    upcomingDoctorBody:
      "Los pacientes solo pueden reservar en los horarios que publiques.",
    patientCta: "Buscar un doctor",
    doctorCta: "Publicar mi disponibilidad",
    pastTitle: "Todavía no hay citas pasadas",
    pastBody: "Aquí queda el historial de tus consultas cuando termines la primera.",
    canceledTitle: "No has cancelado ninguna cita",
    canceledBody: "Las citas canceladas se registran acá, junto con su motivo.",
  },

  pattern: {
    openCreate: "Planear horario",
    openDelete: "Liberar rango",
    singleSlot: "Turno suelto",

    title: "Planear horario",
    modeSingle: "Un día",
    modeRecurring: "Varios días",
    singleHint: "Publica los turnos de una sola fecha.",
    recurringHint: "Repite el mismo horario en los días que elijas.",
    singleDate: "Fecha",
    days: "Días",
    presetWeekdays: "Lunes a viernes",
    presetMonToSat: "Lunes a sábado",
    presetWeekend: "Fin de semana",

    blocks: "Franjas del día",
    addBlock: "Agregar franja",
    removeBlock: "Quitar franja",
    blockFrom: "Desde",
    blockTo: "Hasta",
    duration: "Duración de cada cita",
    minutesShort: "min",
    dateFrom: "Desde",
    dateTo: "Hasta",

    review: "Ver resumen",
    back: "Volver",
    publishCount: "Publicar {count} turnos",
    publishing: "Publicando…",

    summaryTotal: "{count} turnos en {days} días con atención",
    summaryPerDay: "{perDay} por día",
    summaryRange: "del {from} al {to}",
    summarySkipped: "{count} se omiten por chocar con horarios que ya tenías",
    summaryLeftover: "Sobran {minutes} min al final de las franjas",
    summaryEmpty:
      "Este patrón no genera ningún turno. Revisa los días y las franjas.",
    seeDetail: "ver",
    hideDetail: "ocultar",

    deleteTitle: "Liberar un rango",
    deleteHint:
      "Se liberan los turnos publicados en ese rango. Los que ya tienen cita agendada se conservan.",
    deleteAllDays: "Todos los días",
    deleteAllOffices: "Todos los consultorios",
    deleteSummary: "Se liberan {count} turnos",
    deleteKept: "{count} se conservan porque ya tienen cita agendada",
    deleteConfirm: "Liberar {count} turnos",
    deleting: "Liberando…",
    deleteEmpty: "No hay turnos para liberar en ese rango.",

    created: "Se publicaron {count} turnos.",
    deleted: "Se liberaron {count} turnos.",
    createError: "No se pudo publicar el horario.",
    deleteError: "No se pudo liberar el rango.",
    invalidBlock: "Revisa las franjas: la hora de inicio debe ser menor a la de fin.",
    noDays: "Elige al menos un día.",
  },

  nav: {
    searchDoctor: "Buscar un Doctor",
    searchDoctorDesc: "Busca un doctor especializado",
    about: "Nosotros",
    aboutDesc: "Aprende más sobre nosotros",
    contact: "Contacto",
    contactDesc: "Contáctanos",
    login: "Iniciar Sesión",
    loginDesc: "Inicia sesión en tu cuenta",
    register: "Registrarse",
    registerDesc: "Crea una cuenta nueva",
    myProfile: "Mi Perfil",
    myProfileDesc: "Ver tu perfil y tus citas",
    viewProfile: "Ver Perfil",
    myAppointments: "Mis Citas",
    myAppointmentsDesc: "Gestionar mis citas médicas",
    availability: "Disponibilidad",
    availabilityDesc: "Publicar tus horarios de atención",
    adminPanel: "Panel de Administración",
    adminPanelDesc: "Gestionar solicitudes de doctores",
    logout: "Cerrar Sesión",
    logoutDesc: "Cerrar sesión en tu cuenta",
    welcome: "Bienvenido",
    languageLabel: "Idioma",
  },

  footer: {
    heading: "Pie de página",
    tagline:
      "Trabaja con nosotros para mejorar la calidad de vida de las personas.",
    patients: "Pacientes",
    specialists: "Especialistas",
    more: "Más",
    workWithUs: "Trabaja con nosotros",
    askFree: "Pregunta Gratis a un Doctor",
    findDoctor: "Buscar un Doctor",
    doctorProfile: "FesamedCare Perfil",
    schedule: "Agenda",
    about: "Nosotros",
    contact: "Contacto",
    services: "Servicios",
    testimonials: "Testimonios",
    claims: "Reclamos",
    privacy: "Privacidad",
    terms: "Términos",
    rights: "Todos los derechos reservados",
  },

  /**
   * Patrones de date-fns, no textos. El español intercala "de" entre día y mes
   * y el inglés no, así que el patrón cambia con el idioma y no basta con
   * pasarle otro `locale` a format().
   */
  formats: {
    dayLong: "EEEE d 'de' MMMM",
    dayLongYear: "EEEE d 'de' MMMM yyyy",
    dateLong: "d 'de' MMMM yyyy",
    monthYear: "MMMM yyyy",
  },

  availability: {
    pageTitle: "Disponibilidad",
    pageSubtitle:
      "Crea y administra los horarios en que los pacientes pueden agendar citas contigo.",
    doctorsOnly: "La disponibilidad es una herramienta para doctores.",
    backToMyProfile: "Volver a mi perfil",

    notApprovedTitle: "Tu perfil todavía no está aprobado por Fesamed.",
    notApprovedBody:
      "Podrás crear horarios cuando el equipo termine de verificarlo.",
    notApprovedLink: "Ver el estado de tu verificación",

    noOfficesTitle: "Aún no tienes consultorios.",
    noOfficesBody: "Debes agregar al menos uno antes de crear horarios.",
    noOfficesLink: "Agregar un consultorio",

    legendAvailable: "Disponible",
    legendBooked: "Ocupado",

    emptyDayTitle: "No hay horarios para este día.",
    emptyDayHint: 'Haz clic en "Agregar" para crear un horario.',
    noDaySelected:
      "Selecciona un día del calendario para ver y gestionar los horarios.",

    officeNotFound: "Consultorio no encontrado",

    addDialogTitle: "Agregar horario",
    fieldDate: "Fecha",
    fieldStartTime: "Hora de inicio",
    fieldEndTime: "Hora de fin",
    fieldOffice: "Consultorio",
    officePlaceholder: "Selecciona un consultorio",
    submitAdd: "Agregar horario",

    loadError: "Error al cargar horarios.",
    createError: "Error al crear el horario.",
    deleteError: "Error al eliminar el horario.",

    disabledNotApproved: "Tu perfil aún no está aprobado por Fesamed.",
    disabledNoOffices: "Agrega un consultorio en tu perfil primero.",
    disabledPastDay: "No se pueden crear horarios en días pasados.",
  },
} as const;

/**
 * Las claves quedan fijas, los valores se ensanchan a `string`.
 *
 * Sin ensanchar, el `as const` de arriba obligaría a que la traducción al
 * inglés fuera literalmente el mismo texto en español.
 */
export type Dictionary = {
  [N in keyof typeof es]: { [K in keyof (typeof es)[N]]: string };
};
