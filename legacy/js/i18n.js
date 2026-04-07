const translations = {
    fr: {
        // Global
        quick_exit: "Sortie Rapide",
        nav_home: "Accueil",
        nav_assistant: "Assistant",
        nav_vault: "Coffre-fort",
        nav_map: "Carte",
        nav_housing: "Hébergement",
        nav_danger: "Urgence",
        nav_rights: "Vos Droits",
        nav_silence: "Silence",
        // index.html
        hero_title: "Trouve de l'aide <br><span style=\"color: var(--oz-color-primary);\">en 2 clics.</span>",
        hero_subtitle: "Le guide social qui te protège et t'oriente immédiatement vers les bonnes structures.",
        btn_assistant: "Parler à l'assistant OriZen",
        btn_share: "👐 Partager cette aide à un proche",
        situation_title: "Quelle est ta situation ?",
        card_housing_title: "Besoin d'un toit ?",
        card_housing_desc: "Orientation immédiate vers l'hébergement d'urgence et les foyers.",
        card_danger_title: "En danger ?",
        card_danger_desc: "Protection immédiate, numéros d'urgence et mise en lieu sûr.",
        card_rights_title: "Tes droits",
        card_rights_desc: "Guides juridiques et accompagnement pour faire valoir tes droits.",
        weather_badge: "❄️ ALERTE GRAND FROID",
        weather_text: "La température est descendue à -2°C. Des haltes de nuit supplémentaires sont ouvertes. Appelle le 115.",
        official_sources: "Données issues de services publics et de sources officielles.",
        partners_title: "Sources & Partenaires Officiels",
        badge_official_data: "🏛️ Données issues de services publics",
        official_verification: "🔒 Informations vérifiées par des sources officielles",
        footer_privacy: "Anonyme • Sécurisé • Sans traces",
        // assistant.html
        assistant_title: "Assistant OriZen",
        assistant_welcome_1: "Bonjour ! Je suis ton assistant OriZen. <br><br> Je m'appuie sur des <strong>sources officielles</strong> (Service-Public.fr) pour t'aider à trouver un <strong>hébergement</strong>, comprendre tes <strong>droits</strong> ou te <strong>protéger</strong>.",
        assistant_welcome_2: "De quoi as-tu besoin tout de suite ?",
        input_placeholder: "Écris ici...",
        chip_housing: "🏠 Hébergement",
        chip_danger: "⚠️ Danger",
        chip_rights: "📄 Droits",
        chip_nearby: "📍 Proche de moi",
        triage_intro: "D'accord, je vais t'aider. Commençons par 3 questions rapides pour mieux t'orienter.",
        q_age: "As-tu moins de 18 ans ?",
        q_danger: "Es-tu en danger immédiat (violences, menace) ?",
        q_city: "Dernière question : Dans quelle ville es-tu ?",
        plan_prep: "Merci. Je prépare ton plan pour <strong>{city}</strong>...",
        plan_title: "Ton plan d'action personnalisé",
        btn_download: "💾 Télécharger",
        btn_share_plan: "🔗 Partager",
        btn_save: "⭐ Sauver",
        btn_clear: "🗑️ Effacer pour sécurité",
        legal_intro: "💡 Sais-tu que tu as un <strong>Droit à l'Hébergement</strong> ? Si on te refuse une place, tu peux montrer cette lettre juridique.",
        btn_legal: "📜 Générer ma Lettre de Droit",
        // Action Plan Steps
        plan_step_danger: "🛡️ Mets-toi en lieu sûr immédiatement",
        plan_step_police: "🚨 Appelle la Police (17) ou le 3919",
        plan_step_discret: "🕶️ Utilise le Mode Discret sur cette application",
        plan_step_child: "📞 Enfance en Danger (119)",
        plan_step_housing: "🏠 Hébergement d'Urgence (115)",
        plan_step_search: "🔍 Structures proches de {city}",
        // silence_content.html
        silence_active_title: "Mode Discret Activé",
        silence_active_desc: "Cette page te permet de naviguer en toute sécurité si quelqu'un surveille ton téléphone.",
        camo_title: "Choisis ton camouflage :",
        camo_weather: "Ressembler à une application Météo",
        camo_calc: "Ressembler à une Calculatrice",
        btn_back_home: "Revenir à l'accueil OriZen",
        // logement_content.html
        housing_hero_title: "Besoin d'un toit ?",
        housing_hero_subtitle: "Plusieurs solutions existent selon ta situation et ton âge.",
        housing_opt1_title: "URGENCE : Tu dors dehors ce soir ?",
        housing_opt1_desc: "Appelle le **115**. C'est un numéro gratuit, joignable 24h/24. Ils cherchent une place en centre d'hébergement d'urgence pour la nuit.",
        housing_opt2_title: "Tu as moins de 18 ans ?",
        housing_opt2_desc: "Tu es sous la protection de l'État. Tu peux aller au commissariat ou au tribunal pour demander l'aide sociale à l'enfance (ASE).",
        housing_opt2_btn: "📍 Trouver l'ASE sur la carte",
        housing_opt3_title: "Entre 18 et 25 ans ?",
        housing_opt3_desc: "Les résidences sociales (FJT) proposent des logements à bas prix pour les jeunes travailleurs ou en formation.",
        // droits_content.html
        rights_hero_title: "Tes Droits Fondamentaux",
        rights_hero_subtitle: "En France, tout jeune a droit à la santé, à l'éducation et à la protection, peu importe sa situation.",
        rights_opt1_title: "Droit à la Santé (PASS)",
        rights_opt1_desc: "Tu peux être soigné gratuitement sans carte vitale dans les **PASS** (Permanence d'Accès aux Soins de Santé) des hôpitaux.",
        rights_opt1_btn: "📍 Trouver une PASS",
        rights_opt2_title: "Droit à l'Éducation",
        rights_opt2_desc: "L'école est obligatoire et gratuite jusqu'à 16 ans, et la formation jusqu'à 18 ans, même sans papiers.",
        rights_opt3_title: "Aide Juridique Gratuite",
        rights_opt3_desc: "Tu peux parler à un avocat gratuitement dans les **Maisons de Justice et du Droit**.",
        rights_opt3_btn: "💬 Question juridique à l'assistant",
        // urgence_content.html
        urgency_hero_badge: "AIDE IMMÉDIATE",
        urgency_hero_title: "Tu n'es pas seul.",
        urgency_hero_subtitle: "Appelle immédiatement si tu es en danger ou si tu as besoin d'un toit ce soir.",
        urgency_btn_17: "Appeler le 17",
        urgency_btn_115: "Appeler le 115",
        urgency_btn_3919: "Appeler le 3919",
        urgency_btn_119: "Appeler le 119",
        urgency_btn_silence: "🤫 Activer le mode Discret (Silence)"
    },
    en: {
        // Global
        quick_exit: "Quick Exit",
        nav_home: "Home",
        nav_assistant: "Assistant",
        nav_vault: "Vault",
        nav_map: "Map",
        nav_housing: "Housing",
        nav_danger: "Urgency",
        nav_rights: "Your Rights",
        nav_silence: "Silence",
        // index.html
        hero_title: "Find help <br><span style=\"color: var(--oz-color-primary);\">in 2 clicks.</span>",
        hero_subtitle: "The social guide that protects you and directs you immediately to the right structures.",
        btn_assistant: "Talk to OriZen Assistant",
        btn_share: "👐 Share this help with a loved one",
        situation_title: "What is your situation?",
        card_housing_title: "Need a roof?",
        card_housing_desc: "Immediate guidance for emergency housing and shelters.",
        card_danger_title: "In danger?",
        card_danger_desc: "Immediate protection, emergency numbers, and safe locations.",
        card_rights_title: "Your rights",
        card_rights_desc: "Legal guides and support to assert your rights.",
        weather_badge: "❄️ COLD WEATHER ALERT",
        weather_text: "Temperature has dropped to -2°C. Additional night shelters are open. Call 115.",
        official_sources: "Data from public services and official sources.",
        partners_title: "Official Sources & Partners",
        badge_official_data: "🏛️ Data from public services",
        official_verification: "🔒 Information verified by official sources",
        footer_privacy: "Anonymous • Secure • Untraceable",
        // assistant.html
        assistant_title: "OriZen Assistant",
        assistant_welcome_1: "Hello! I am your OriZen assistant. <br><br> I rely on <strong>official sources</strong> (Service-Public.fr) to help you find <strong>housing</strong>, understand your <strong>rights</strong>, or <strong>protect</strong> you.",
        assistant_welcome_2: "What do you need right now?",
        input_placeholder: "Type here...",
        chip_housing: "🏠 Housing",
        chip_danger: "⚠️ Danger",
        chip_rights: "📄 Rights",
        chip_nearby: "📍 Near me",
        triage_intro: "Okay, I will help you. Let's start with 3 quick questions to better orient you.",
        q_age: "Are you under 18?",
        q_danger: "Are you in immediate danger (violence, threat)?",
        q_city: "Last question: Which city are you in?",
        plan_prep: "Thank you. I am preparing your plan for <strong>{city}</strong>...",
        plan_title: "Your Personalized Action Plan",
        btn_download: "💾 Download",
        btn_share_plan: "🔗 Share",
        btn_save: "⭐ Save",
        btn_clear: "🗑️ Clear for Safety",
        legal_intro: "💡 Did you know you have a <strong>Right to Housing</strong>? If you are refused a place, you can show this legal letter.",
        btn_legal: "📜 Generate my Legal Letter",
        // Action Plan Steps
        plan_step_danger: "🛡️ Get to safety immediately",
        plan_step_police: "🚨 Call Police (17) or 3919",
        plan_step_discret: "🕶️ Use Discreet Mode on this application",
        plan_step_child: "📞 Child in Danger (119)",
        plan_step_housing: "🏠 Emergency Housing (115)",
        plan_step_search: "🔍 Nearby structures in {city}",
        // silence_content.html
        silence_active_title: "Discreet Mode Activated",
        silence_active_desc: "This page allows you to browse safely if someone is monitoring your phone.",
        camo_title: "Choose your camouflage:",
        camo_weather: "Look like a Weather app",
        camo_calc: "Look like a Calculator",
        btn_back_home: "Back to OriZen Home",
        // logement_content.html
        housing_hero_title: "Need a roof?",
        housing_hero_subtitle: "Several solutions exist depending on your situation and age.",
        housing_opt1_title: "EMERGENCY: Sleeping outside tonight?",
        housing_opt1_desc: "Call **115**. It's a free number, reachable 24/7. They look for a place in an emergency shelter for the night.",
        housing_opt2_title: "Are you under 18?",
        housing_opt2_desc: "You are under the protection of the State. You can go to the police station or court to request child social assistance (ASE).",
        housing_opt2_btn: "📍 Find ASE on the map",
        housing_opt3_title: "Between 18 and 25?",
        housing_opt3_desc: "Social residences (FJT) offer low-cost housing for young workers or students.",
        // droits_content.html
        rights_hero_title: "Your Fundamental Rights",
        rights_hero_subtitle: "In France, every young person has the right to health, education, and protection, regardless of their situation.",
        rights_opt1_title: "Right to Health (PASS)",
        rights_opt1_desc: "You can be treated for free without a social security card at hospital **PASS** (Health Care Access Points).",
        rights_opt1_btn: "📍 Find a PASS",
        rights_opt2_title: "Right to Education",
        rights_opt2_desc: "School is mandatory and free until 16, and training until 18, even without papers.",
        rights_opt3_title: "Free Legal Help",
        rights_opt3_desc: "You can talk to a lawyer for free at **Houses of Justice and Law**.",
        rights_opt3_btn: "💬 Legal question to the assistant",
        // urgence_content.html
        urgency_hero_badge: "IMMEDIATE HELP",
        urgency_hero_title: "You are not alone.",
        urgency_hero_subtitle: "Call immediately if you are in danger or need a roof tonight.",
        urgency_btn_17: "Call 17",
        urgency_btn_115: "Call 115",
        urgency_btn_3919: "Call 3919",
        urgency_btn_119: "Call 119",
        urgency_btn_silence: "🤫 Activate Discreet Mode (Silence)"
    },
    ar: {
        // Global
        quick_exit: "خروج سريع",
        nav_home: "الرئيسية",
        nav_assistant: "المساعد",
        nav_vault: "الخزنة",
        nav_map: "الخريطة",
        nav_housing: "السكن",
        nav_danger: "الطوارئ",
        nav_rights: "حقوقك",
        nav_silence: "صمت",
        // index.html
        hero_title: "جد المساعدة <br><span style=\"color: var(--oz-color-primary);\">بنقرتين فقط.</span>",
        hero_subtitle: "الدليل الاجتماعي الذي يحميك ويوجهك فوراً إلى الهياكل المناسبة.",
        btn_assistant: "تحدث مع مساعد OriZen",
        btn_share: "👐 شارك هذه المساعدة مع شخص مقرب",
        situation_title: "ما هو وضعك؟",
        card_housing_title: "هل تحتاج إلى سكن؟",
        card_housing_desc: "توجيه فوري نحو السكن الطارئ والملاجئ.",
        card_danger_title: "هل أنت في خطر؟",
        card_danger_desc: "حماية فورية، أرقام طوارئ وتوفير مكان آمن.",
        card_rights_title: "حقوقك",
        card_rights_desc: "أدلة قانونية ودعم للمطالبة بحقوقك.",
        weather_badge: "❄️ تنبيه برد شديد",
        weather_text: "انخفضت درجة الحرارة إلى -2 درجة مئوية. تم فتح ملاجئ ليلية إضافية. اتصل بـ 115.",
        official_sources: "بيانات من المرافق العامة والمصادر الرسمية.",
        partners_title: "المصادر والشركاء الرسميون",
        badge_official_data: "🏛️ بيانات من المرافق العامة",
        official_verification: "🔒 معلومات موثقة من مصادر رسمية",
        footer_privacy: "مجهول • آمن • بدون أثر",
        // assistant.html
        assistant_title: "مساعد OriZen",
        assistant_welcome_1: "مرحباً! أنا مساعدك من OriZen. <br><br> أعتمد على <strong>مصادر رسمية</strong> لمساعدتك في العثور على <strong>سكن</strong>، فهم <strong>حقوقك</strong> أو <strong>حمايتك</strong>.",
        assistant_welcome_2: "ماذا تحتاج الآن؟",
        input_placeholder: "اكتب هنا...",
        chip_housing: "🏠 سكن",
        chip_danger: "⚠️ خطر",
        chip_rights: "📄 حقوق",
        chip_nearby: "📍 بالقرب مني",
        triage_intro: "حسناً، سأساعدك. لنبدأ بـ 3 أسئلة سريعة لتوجيهك بشكل أفضل.",
        q_age: "هل عمرك أقل من 18 عاماً؟",
        q_danger: "هل أنت في خطر مباشر (عنف، تهديد)؟",
        q_city: "السؤال الأخير: في أي مدينة أنت؟",
        plan_prep: "شكراً لك. أنا أعد خطتك لـ <strong>{city}</strong>...",
        plan_title: "خطة عملك المخصصة",
        btn_download: "💾 تحميل",
        btn_share_plan: "🔗 مشاركة",
        btn_save: "⭐ حفظ",
        btn_clear: "🗑️ مسح للأمان",
        legal_intro: "💡 هل تعلم أن لك <strong>حق في السكن</strong>؟ إذا تم رفضك، يمكنك إظهار هذه الرسالة القانونية.",
        btn_legal: "📜 إنشاء رسالتي القانونية",
        // Action Plan Steps
        plan_step_danger: "🛡️ توجه إلى مكان آمن فوراً",
        plan_step_police: "🚨 اتصل بالشرطة (17) أو 3919",
        plan_step_discret: "🕶️ استخدم وضع التخفي في هذا التطبيق",
        plan_step_child: "📞 طفل في خطر (119)",
        plan_step_housing: "🏠 السكن الطارئ (115)",
        plan_step_search: "🔍 الهياكل المجاورة في {city}",
        // silence_content.html
        silence_active_title: "وضع التخفي مفعل",
        silence_active_desc: "تسمح لك هذه الصفحة بالتصفح بأمان إذا كان هناك شخص يراقب هاتفك.",
        camo_title: "اختر تمويهك:",
        camo_weather: "الظهور كتطبيق طقس",
        camo_calc: "الظهور كآلة حاسبة",
        btn_back_home: "العودة إلى رئيسية OriZen",
        // logement_content.html
        housing_hero_title: "هل تحتاج إلى سكن؟",
        housing_hero_subtitle: "توجد عدة حلول حسب وضعك وعمرك.",
        housing_opt1_title: "طوارئ: هل تنام في الخارج الليلة؟",
        housing_opt1_desc: "اتصل بـ **115**. إنه رقم مجاني متاح 24/7. يبحثون عن مكان في مراكز الإيواء الطارئة لليلة.",
        housing_opt2_title: "هل عمرك أقل من 18 عاماً؟",
        housing_opt2_desc: "أنت تحت حماية الدولة. يمكنك الذهاب إلى مركز الشرطة أو المحكمة لطلب المساعدة الاجتماعية للطفولة (ASE).",
        housing_opt2_btn: "📍 ابحث عن ASE على الخريطة",
        housing_opt3_title: "بين 18 و 25 عاماً؟",
        housing_opt3_desc: "تقدم المساكن الاجتماعية (FJT) مساكن بأسعار منخفضة للعمال الشباب أو المتدربين.",
        // droits_content.html
        rights_hero_title: "حقوقك الأساسية",
        rights_hero_subtitle: "في فرنسا، لكل شاب حق في الصحة والتعليم والحماية، بغض النظر عن وضعه.",
        rights_opt1_title: "الحق في الصحة (PASS)",
        rights_opt1_desc: "يمكنك الحصول على العلاج مجاناً بدون بطاقة صحية في نقاط الوصول إلى الرعاية الصحية (PASS) في المستشفيات.",
        rights_opt1_btn: "📍 ابحث عن PASS",
        rights_opt2_title: "الحق في التعليم",
        rights_opt2_desc: "المدرسة إجبارية ومجانية حتى سن 16 عاماً، والتدريب حتى سن 18 عاماً، حتى بدون أوراق.",
        rights_opt3_title: "مساعدة قانونية مجانية",
        rights_opt3_desc: "يمكنك التحدث إلى محامٍ مجاناً في دور العدالة والقانون.",
        rights_opt3_btn: "💬 سؤال قانوني للمساعد",
        // urgence_content.html
        urgency_hero_badge: "مساعدة فورية",
        urgency_hero_title: "لست وحدك.",
        urgency_hero_subtitle: "اتصل فوراً إذا كنت في خطر أو بحاجة لسكن الليلة.",
        urgency_btn_17: "اتصل بـ 17",
        urgency_btn_115: "اتصل بـ 115",
        urgency_btn_3919: "اتصل بـ 3919",
        urgency_btn_119: "اتصل بـ 119",
        urgency_btn_silence: "🤫 تفعيل وضع التخفي (صمت)"
    }
};

function setLanguage(lang) {
    localStorage.setItem('orizen_lang', lang);
    document.documentElement.lang = lang;
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Update lang select if it exists on page
    const select = document.getElementById('langSelect');
    if (select) select.value = lang;
}

function initI18n() {
    const savedLang = localStorage.getItem('orizen_lang') || 'fr';
    setLanguage(savedLang);
}

window.translations = translations;
window.getT = (key) => {
    const lang = localStorage.getItem('orizen_lang') || 'fr';
    return (translations[lang] && translations[lang][key]) ? translations[lang][key] : key;
};

window.addEventListener('DOMContentLoaded', initI18n);
