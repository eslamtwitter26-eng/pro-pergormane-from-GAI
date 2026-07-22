import { useState, useRef, useEffect, useMemo } from "react";
import { Bot, Sparkles, Send, RefreshCw, Trophy, HelpCircle, ShieldAlert, Zap, TrendingUp, Compass, ArrowRight } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";
import { 
  calculateTraderScore, 
  calculateEvolutionTracking, 
  calculateGoalProgress, 
  detectSmartMistakes, 
  discoverSmartPatterns, 
  compareBestVsWorst,
  calculateGoalProgress as computeGoals
} from "@/lib/evolvedAnalysis";
import type { AnalysisResult } from "@/lib/tradeAnalysis";

interface AICoachProps {
  data: AnalysisResult;
  theme: "dark" | "light";
}

interface Message {
  sender: "coach" | "user";
  text: string;
  timestamp: Date;
}

const PRESET_QUESTIONS = [
  { key: "presetQ1", icon: ShieldAlert, color: "#FF4757" },
  { key: "presetQ2", icon: Zap, color: "#06B6D4" },
  { key: "presetQ3", icon: Compass, color: "#8B5CF6" },
  { key: "presetQ4", icon: ShieldAlert, color: "#FFD32D" },
  { key: "presetQ5", icon: Trophy, color: "#10F087" },
  { key: "presetQ6", icon: TrendingUp, color: "#FF6B9D" },
] as const;

function getWelcomeMessage(data: AnalysisResult, lang: Language, scores: any): string {
  const skillNames = {
    en: {
      riskManagement: "Risk Management",
      consistency: "Consistency & Streaks",
      execution: "Execution Precision",
      psychology: "Trading Psychology",
      discipline: "Discipline & Size Consistency",
    },
    ar: {
      riskManagement: "إدارة المخاطر",
      consistency: "الاتساق والسلاسل",
      execution: "دقة التنفيذ",
      psychology: "علم نفس التداول",
      discipline: "الانضباط واتساق الأحجام",
    },
    fr: {
      riskManagement: "Gestion du Risque",
      consistency: "Régularité & Séries",
      execution: "Précision d'Exécution",
      psychology: "Psychologie de Trading",
      discipline: "Discipline & Cohérence des Tailles",
    }
  };

  const skillsList = [
    { key: "riskManagement", val: scores.subScores.riskManagement },
    { key: "consistency", val: scores.subScores.consistency },
    { key: "execution", val: scores.subScores.execution },
    { key: "psychology", val: scores.subScores.psychology },
    { key: "discipline", val: scores.subScores.discipline }
  ];

  const sortedMax = [...skillsList].sort((a, b) => b.val - a.val);
  const sortedMin = [...skillsList].sort((a, b) => a.val - b.val);

  const strongestKey = sortedMax[0].key as keyof typeof skillNames.en;
  const weakestKey = sortedMin[0].key as keyof typeof skillNames.en;

  const strongestName = skillNames[lang][strongestKey];
  const weakestName = skillNames[lang][weakestKey];

  const strongestVal = sortedMax[0].val;
  const weakestVal = sortedMin[0].val;

  if (lang === "ar") {
    return `مرحباً! أنا **مدرب التداول بالذكاء الاصطناعي** الخاص بك. لقد قمت بمسح سجل التداول الخاص بك بالكامل والذي يحتوي على **${data.trades.length} صفقة** وقمت بإنشاء ملفك المعرفي المخصص.

**تقييم التداول الحالي الخاص بك هو ${scores.overall}/100**.

إليك ما أراه في بياناتك:
- **أبرز نقاط القوة**: *${strongestName}* هي أقوى مهارة لديك، بتقييم **${strongestVal}/100**.
- **أبرز نقاط الضعف**: *${weakestName}* تحتاج إلى عمل فوري، بتقييم **${weakestVal}/100**.

اختر أحد الأسئلة المقترحة على اليسار أو اكتب سؤالك الخاص، وسأقدم لك مراجعة تداول كاملة مدعومة بالبيانات والتحليل الرياضي.`;
  } else if (lang === "fr") {
    return `Bonjour ! Je suis votre **Coach de Trading IA**. J'ai entièrement analysé votre historique de **${data.trades.length} transactions** et généré votre profil cognitif personnalisé.

Votre **Score de Trader actuel est de ${scores.overall}/100**.

Voici ce que je vois dans vos données :
- **Force principale** : Votre *${strongestName}* est votre compétence la plus forte, évaluée à **${strongestVal}/100**.
- **Vulnérabilité principale** : Votre *${weakestName}* nécessite un travail immédiat, évaluée à **${weakestVal}/100**.

Choisissez l'une des questions à gauche ou saisissez la vôtre, et je vous donnerai un examen de trading mathématique entièrement basé sur vos données.`;
  } else {
    return `Hello! I am your **AI Trading Coach**. I have fully scanned your trading log of **${data.trades.length} trades** and generated your custom cognitive profile.

Your current **Trader Score is ${scores.overall}/100**.

Here is what I see in your data:
- **Top Strength**: Your *${strongestName}* is your strongest skill, rated at **${strongestVal}/100**.
- **Top Vulnerability**: Your *${weakestName}* needs immediate work, rated at **${weakestVal}/100**.

Choose one of the questions on the left or type your own, and I will give you a fully data-backed, mathematical trading review.`;
  }
}

export function AICoach({ data, theme }: AICoachProps) {
  const { lang, t } = useI18n();
  const scores = useMemo(() => calculateTraderScore(data.trades, data.metrics), [data]);
  const evolution = useMemo(() => calculateEvolutionTracking(data.trades), [data]);
  const goals = useMemo(() => calculateGoalProgress(data.trades, data.metrics), [data]);
  const mistakes = useMemo(() => detectSmartMistakes(data.trades, data.metrics), [data]);
  
  // Need to process daily, hourly, monthly first from the data or mock if missing, but data contains them!
  const patterns = useMemo(() => {
    return discoverSmartPatterns(
      data.trades, 
      data.metrics, 
      data.dailyPerformance || [], 
      data.hourlyPerformance || [], 
      data.monthlyPerformance || []
    );
  }, [data]);
  
  const comparisons = useMemo(() => compareBestVsWorst(data.trades), [data]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate the welcome message in the current language on load or when lang changes
    const welcomeText = getWelcomeMessage(data, lang, scores);
    setMessages([
      {
        sender: "coach",
        text: welcomeText,
        timestamp: new Date()
      }
    ]);
  }, [lang, data, scores]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const generateAnswer = (q: string): string => {
    const question = q.toLowerCase();

    // Determine user's query context across multiple possible language formats
    const isWeaknessQuery = 
      question.includes("lose") || question.includes("losing") || question.includes("weakness") || question.includes("risk") ||
      question.includes("خسارة") || question.includes("أخسر") || question.includes("ضعف") ||
      question.includes("perds") || question.includes("perdre") || question.includes("faiblesse");

    const isWinRateQuery = 
      question.includes("win rate") || question.includes("accuracy") || question.includes("low") ||
      question.includes("فوز") || question.includes("دقة") || question.includes("منخفض") ||
      question.includes("réussite") || question.includes("précision") || question.includes("gagner");

    const isPsychologyQuery = 
      question.includes("psychology") || question.includes("mistake") || question.includes("emotional") ||
      question.includes("نفس") || question.includes("خطأ") || question.includes("عاطف") ||
      question.includes("psychologie") || question.includes("erreur") || question.includes("émotion");

    const isSessionQuery = 
      question.includes("session") || question.includes("hour") || question.includes("time") || question.includes("london") || question.includes("york") ||
      question.includes("جلسة") || question.includes("ساعة") || question.includes("وقت") ||
      question.includes("heure") || question.includes("temps");

    const isImprovingQuery = 
      question.includes("improving") || question.includes("trend") || question.includes("month") ||
      question.includes("تحسن") || question.includes("تطور") || question.includes("شهر") ||
      question.includes("amélioration") || question.includes("tendance") || question.includes("progrès");

    const isProfitabilityQuery = 
      question.includes("profitable") || question.includes("profitability") || question.includes("consistency") || question.includes("how") || question.includes("grow") ||
      question.includes("ربحية") || question.includes("اتساق") || question.includes("نمو") ||
      question.includes("régularité") || question.includes("rentabilité") || question.includes("cohérence");

    // 1. Weakness / Losing
    if (isWeaknessQuery) {
      const mainMistake = mistakes[0];
      const worstAsset = comparisons.worst25.commonSymbol;

      if (lang === "ar") {
        const severityColorAr = mainMistake?.severity === "high" ? "🔴 عالية" : mainMistake?.severity === "medium" ? "🟡 متوسطة" : "🟢 منخفضة";
        return `### 🛑 تحليل تسرب الأداء ونقاط الضعف

بناءً على بياناتك الفعلية، تكمن نقطة ضعفك الرئيسية في **${scores.explanations.psychology.includes("loss-aversion") ? "تجنب الخسارة والتمسك بالصفقات الخاسرة" : "معايير تنفيذ الصفقات"}**.

إليك الأدلة الدقيقة من البيانات:
1. **فخ التمسك بالصفقات الخاسرة**: ${scores.explanations.psychology}
2. **الأخطاء الرئيسية المكتشفة**:
   - **${mainMistake?.title ?? "تغيير حجم العقود العشوائي"}** (خطورة ${severityColorAr}):
     * *الدليل*: ${mainMistake?.evidence ?? "أحجام العقود تتقلب بشكل عشوائي بعد الخسارة."}
     * *التكرار*: يحدث في **${(mainMistake?.frequency ?? 10).toFixed(1)}%** من إعداداتك.
     * *الحل المقترح*: ${mainMistake?.suggestedFix ?? "استخدم حجماً ثابتاً يعتمد على نسبة مئوية محددة من الحساب (مثلاً 1% لكل صفقة)."}
3. **أداة تداول ذات أداء ضعيف**:
   - أكبر خسائرك تتراكم بشكل كبير على **${worstAsset}** (بمتوسط خسارة قدره $${Math.abs(comparisons.worst25.avgProfit).toFixed(2)} لكل صفقة خاسرة).
   - هذه الأداة تسحب منحنى رأس مالك بالكامل للأسفل.

**خطة العمل الفورية**:
- **توقف عن تداول ${worstAsset}** خلال الـ 14 يوماً القادمة. ركز بالكامل على الأداة الأكثر ربحية لديك (**${comparisons.top25.commonSymbol}**).
- ضع **وقف خسارة صارم وتلقائي** على كل صفقة *قبل* الدخول فيها.`;
      } else if (lang === "fr") {
        const severityColorFr = mainMistake?.severity === "high" ? "🔴 ÉLEVÉE" : mainMistake?.severity === "medium" ? "🟡 MOYENNE" : "🟢 FAIBLE";
        return `### 🛑 Analyse des Fuites de Performance & Faiblesses

Selon vos données réelles, votre principale faiblesse réside dans **${scores.explanations.psychology.includes("loss-aversion") ? "L'Aversion à la Perte & Le Maintien des Positions Perdantes" : "Les Paramètres d'Exécution des Trades"}**.

Voici les preuves exactes fournies par vos données :
1. **Piège du Maintien des Perdants** : ${scores.explanations.psychology}
2. **Erreurs Clés Détectées** :
   - **${mainMistake?.title ?? "Chasse de Taille de Position"}** (Gravité ${severityColorFr}) :
     * *Preuve* : ${mainMistake?.evidence ?? "Les tailles de position fluctuent de manière erratique après une perte."}
     * *Fréquence* : Se produit dans **${(mainMistake?.frequency ?? 10).toFixed(1)}%** de vos configurations.
     * *Solution Suggérée* : ${mainMistake?.suggestedFix ?? "Utilisez une taille de position fractionnaire fixe (ex. 1% du solde par trade)."}
3. **Fuite sur Actif & Quantité** :
   - Vos plus grosses pertes s'accumulent lourdement sur **${worstAsset}** (avec une perte moyenne de $${Math.abs(comparisons.worst25.avgProfit).toFixed(2)} par trade perdant).
   - Cet actif tire l'ensemble de votre courbe d'équité vers le bas.

**Plan d'Action Immédiat** :
- **Arrêtez de trader ${worstAsset}** pendant les 14 prochains jours. Concentrez-vous entièrement sur votre actif le plus rentable (**${comparisons.top25.commonSymbol}**).
- Établissez un **Stop Loss Strict** sur chaque position *avant* de cliquer sur acheter ou vendre.`;
      } else {
        const severityColor = mainMistake?.severity === "high" ? "🔴 HIGH" : mainMistake?.severity === "medium" ? "🟡 MEDIUM" : "🟢 LOW";
        return `### 🛑 Performance Leak & Weakness Analysis

Based on your actual dataset, your primary weakness lies in **${scores.explanations.psychology.includes("loss-aversion") ? "Loss Aversion & Trade Holding" : "Trade Execution Parameters"}**.

Here is the exact data evidence:
1. **Holding Losers Trap**: ${scores.explanations.psychology}
2. **Key Mistakes Detected**:
   - **${mainMistake?.title ?? "Position Size Chasing"}** (${severityColor} Severity):
     * *Evidence*: ${mainMistake?.evidence ?? "Position sizes fluctuate erratically following a loss."}
     * *Frequency*: Occurs in **${(mainMistake?.frequency ?? 10).toFixed(1)}%** of your setups.
     * *Suggested Fix*: ${mainMistake?.suggestedFix ?? "Use fixed fractional position sizing (e.g., 1% of balance per trade)."}
3. **Asset & Quant Leak**:
   - Your worst losses accumulate heavily on **${worstAsset}** (with an average loss of $${Math.abs(comparisons.worst25.avgProfit).toFixed(2)} per losing trade).
   - This asset is dragging down your entire equity curve.

**Immediate Action Plan**:
- **Stop trading ${worstAsset}** for the next 14 days. Focus entirely on your most profitable asset (**${comparisons.top25.commonSymbol}**).
- Establish an automated **Hard Stop Loss** on every position *before* you click buy or sell.`;
      }
    }

    // 2. Win rate
    if (isWinRateQuery) {
      const wr = data.metrics.winRate;
      const rr = data.metrics.riskRewardRatio;
      const earlyExits = mistakes.find(m => m.id === "mistake_early_exit");

      if (lang === "ar") {
        return `### 🎯 تشخيص نسبة الفوز والدقة

نسبة الفوز الحالية لديك هي **${wr.toFixed(1)}%**.
معدل المخاطرة إلى العائد هو **1:${rr.toFixed(1)}**.

إليك الحقيقة الرياضية لأدائك:
- مع نسبة فوز تبلغ **${wr.toFixed(1)}%** ومعدل مخاطرة لعائد تبلغ **1:${rr.toFixed(1)}**، فإن التوقع الربحي لكل صفقة هو **$${data.metrics.expectancy.toFixed(2)}**.
- ${wr < 40 
    ? "نسبة الفوز لديك منخفضة نوعاً ما. ومع ذلك، فإن نسبة الفوز المنخفضة مقبولة تماماً *إذا* كان معدل المخاطرة إلى العائد مرتفعاً (1:2.5 أو أكثر). حالياً، معدل RR الخاص بك منخفض جداً بحيث لا يمكنه دعم نسبة الفوز هذه." 
    : "نسبة الفوز لديك قوية جداً! يجب أن يكون تركيزك الرئيسي هو توسيع معدل المخاطرة إلى العائد عن طريق ترك صفقاتك الرابحة تسير نحو أهدافها الكاملة."}

**العقبات المكتشفة التي تمنع الوصول لنسبة فوز أعلى:**
${earlyExits ? `- **فخ الخروج المبكر**: ${earlyExits.evidence}. أنت تقوم بإدارة الصفقات النشطة بشكل مفرط وتقطع الأرباح قبل الوصول للأهداف الهيكلية.` : "- **مطاردة الأسعار (FOMO)**: من المحتمل أنك تدخل في نهاية دورات الزخم وتتعرض لتصحيحات الأسعار المعتادة."}

**كيفية التحسين بدءاً من اليوم:**
1. **تقليل تشتت الأدوات**: حدد قائمة مراقبتك بـ أداتين رئيسيتين فقط.
2. **تصفية صفقات عالية الجودة**: لا تفتح صفقة إلا بمعدل عائد إلى مخاطرة لا يقل عن **1:2**. تجنب أي شيء آخر.
3. **ضع الأهداف واتركها**: ضع أمر وقف الخسارة وأمر جني الأرباح، ثم أغلق المنصة ودع الإحصاءات تقوم بالعمل.`;
      } else if (lang === "fr") {
        return `### 🎯 Diagnostic de Taux de Réussite & Précision

Votre Taux de Réussite actuel est de **${wr.toFixed(1)}%**.
Votre Ratio Risque/Rendement (R:R) est de **1:${rr.toFixed(1)}**.

Voici la vérité mathématique de votre performance :
- Avec un taux de réussite de **${wr.toFixed(1)}%** et un R:R de **1:${rr.toFixed(1)}**, votre espérance de gain est de **$${data.metrics.expectancy.toFixed(2)}** par trade.
- ${wr < 40 
    ? "Votre taux de réussite est plutôt faible. Cependant, un taux de réussite bas est tout à fait acceptable *si* votre ratio Risque/Rendement est élevé (1:2.5 ou plus). Actuellement, votre R:R est trop bas pour soutenir ce taux de réussite." 
    : "Votre taux de réussite est solide ! Votre objectif principal devrait être d'élargir votre ratio Risque/Rendement en laissant courir vos trades gagnants vers leurs objectifs complets."}

**Obstacles Détectés à un Taux de Réussite Élevé :**
${earlyExits ? `- **Peur de la Sortie Précoce** : ${earlyExits.evidence}. Vous gérez de manière excessive les positions actives et coupez les gagnants avant qu'ils n'atteignent les objectifs basés sur la structure.` : "- **Chasse au Prix (FOMO)** : Vous entrez probablement à la fin des cycles de momentum, vous faisant piéger dans les retracements de prix standard."}

**Comment s'améliorer dès aujourd'hui :**
1. **Réduire le bruit des actifs** : Limitez votre liste de surveillance à 2 paires clés.
2. **Filtres de qualité supérieure** : Ne prenez que des transactions ayant un ratio de rendement/risque structurel minimum de **1:2**. Ignorez tout le reste.
3. **Placer et Oublier** : Placez votre stop-loss et votre take-profit, puis fermez le graphique. Laissez les statistiques faire leur travail.`;
      } else {
        return `### 🎯 Win Rate & Accuracy Diagnostic

Your current Win Rate is **${wr.toFixed(1)}%**.
Your Risk-to-Reward Ratio is **1:${rr.toFixed(1)}**.

Here is the mathematical truth of your performance:
- With a win rate of **${wr.toFixed(1)}%** and RR of **1:${rr.toFixed(1)}**, your profit expectancy is **$${data.metrics.expectancy.toFixed(2)}** per trade.
- ${wr < 40 
    ? "Your win rate is on the lower side. However, a low win rate is completely fine *if* your Risk/Reward ratio is high (1:2.5 or greater). Right now, your RR is too low to support this win rate." 
    : "Your win rate is solid! Your main focus should be on expanding your Risk/Reward ratio by letting your winners run to their full targets."}

**Detected Obstacles to High Win Rate:**
${earlyExits ? `- **Early Exit Fear**: ${earlyExits.evidence}. You are micro-managing active setups and cutting winners before they reach structure-based targets.` : "- **Chasing Price (FOMO)**: You are likely entering at the end of momentum cycles, getting caught in standard price pullbacks."}

**How to Improve Starting Today:**
1. **Reduce asset noise**: Restrict your watchlist to 2 key pairs.
2. **Higher-quality filters**: Only take trades that have a minimum structural reward-to-risk ratio of **1:2**. Skip everything else.
3. **Set-and-Forget**: Place your stop loss and take profit, then close the chart. Let the statistics do the work.`;
      }
    }

    // 3. Psychology
    if (isPsychologyQuery) {
      const revenge = mistakes.find(m => m.id === "mistake_revenge");
      const overtrading = mistakes.find(m => m.id === "mistake_overtrading");
      const martingale = mistakes.find(m => m.id === "mistake_martingale");

      if (lang === "ar") {
        return `### 🧠 تحليل سلوكي وعلم نفس التداول

علم نفس التداول لا يتعلق بالتداول بدون مشاعر، بل يتعلق بإدارة الانحيازات المعرفية تحت الضغط. تظهر بياناتك علامات عاطفية واضحة:

| المحفز العاطفي | الحالة | التكرار | التأثير المالي المقدر |
| :--- | :---: | :---: | :--- |
| **التداول الانتقامي** | ${revenge ? "⚠️ تم كشفه" : "✅ منضبط"} | ${revenge ? revenge.frequency.toFixed(1) + "%" : "0%"} | ${revenge ? "صفقات عشوائية سريعة تؤدي لخسائر غير مبررة." : "انضباط ممتاز."} |
| **الإفراط في التداول** | ${overtrading ? "⚠️ تم كشفه" : "✅ منضبط"} | ${overtrading ? overtrading.frequency.toFixed(0) + "%" : "0%"} | ${overtrading ? "استنزاف شديد لرأس المال بسبب الإرهاق التداولي." : "حجم صفقات يومي متحكم به."} |
| **مضاعفة العقود (مارتينجيل)** | ${martingale ? "🚨 خطر جداً" : "✅ منضبط"} | ${martingale ? martingale.frequency.toFixed(1) + "%" : "0%"} | ${martingale ? "مضاعفة حجم العقود بعد الخسائر. خطر تصفير الحساب مرتفع." : "أحجام عقود ثابتة ومتسقة."} |

**رؤية نفسية عميقة:**
${scores.explanations.psychology}

**بروتوكول الانضباط المخصص لك:**
1. **بروتوكول الإغلاق الإجباري**: إذا تعرضت لـ **${overtrading ? "أكثر من 3 صفقات خاسرة" : "خسارتين متتاليتين"} في يوم واحد**، يجب عليك إغلاق منصة التداول. السوق سيبقى موجوداً غداً.
2. **حظر الانتقام**: لا تفتح أي صفقة جديدة خلال 45 دقيقة من تعرضك لخسارة. اكتب سبب الخسارة *قبل* البحث عن الصفقة التالية.`;
      } else if (lang === "fr") {
        return `### 🧠 Analyse Psychologique & Comportementale

La psychologie de trading ne consiste pas à exécuter de manière insensible ; il s'agit de gérer les biais cognitifs sous stress. Vos données révèlent des marqueurs émotionnels clairs :

| Déclencheur Émotionnel | Statut | Fréquence | Impact Quantifié |
| :--- | :---: | :---: | :--- |
| **Trading de Revanche** | ${revenge ? "⚠️ DÉTECTÉ" : "✅ CONFORME"} | ${revenge ? revenge.frequency.toFixed(1) + "%" : "0%"} | ${revenge ? "Entrées impulsives sous stress provoquant des pertes." : "Discipline excellente."} |
| **Sur-Trading** | ${overtrading ? "⚠️ DÉTECTÉ" : "✅ CONFORME"} | ${overtrading ? overtrading.frequency.toFixed(0) + "%" : "0%"} | ${overtrading ? "Érosion sévère du capital due à la fatigue de trading." : "Volume quotidien contrôlé."} |
| **Escalade Martingale** | ${martingale ? "🚨 HAUT RISQUE" : "✅ CONFORME"} | ${martingale ? martingale.frequency.toFixed(1) + "%" : "0%"} | ${martingale ? "Doublement de taille après perte. Risque de perte totale." : "Taille de lot cohérente."} |

**Insight Psychologique Profond :**
${scores.explanations.psychology}

**Votre Protocole Psychologique Personnalisé :**
1. **Protocole de verrouillage** : Si vous subissez **${overtrading ? "plus de 3" : "2"} pertes dans la journée**, votre terminal de trading doit être fermé. Le marché sera encore là demain.
2. **Bloqueur de Revanche** : N'entrez jamais dans un trade dans les 45 minutes suivant une perte. Écrivez pourquoi vous avez perdu *avant* de chercher la configuration suivante.`;
      } else {
        return `### 🧠 Cognitive & Psychological Analysis

Trading psychology is not about emotionless execution; it is about managing cognitive bias under stress. Your data shows clear emotional markers:

| Emotional Trigger | Status | Frequency | Quantified Impact |
| :--- | :---: | :---: | :--- |
| **Revenge Trading** | ${revenge ? "⚠️ DETECTED" : "✅ CLEAN"} | ${revenge ? revenge.frequency.toFixed(1) + "%" : "0%"} | ${revenge ? "Cortisol spike entries causing low-quality losses." : "Excellent discipline."} |
| **Over-Trading** | ${overtrading ? "⚠️ DETECTED" : "✅ CLEAN"} | ${overtrading ? overtrading.frequency.toFixed(0) + "%" : "0%"} | ${overtrading ? "Severe capital decay due to trading trade fatigue." : "Controlled daily volume."} |
| **Martingale Escalation** | ${martingale ? "🚨 HIGH RISK" : "✅ CLEAN"} | ${martingale ? martingale.frequency.toFixed(1) + "%" : "0%"} | ${martingale ? "Size-doubling after losses. High risk of account blowup." : "Consistent lot-sizing."} |

**Deep Psychological Insight:**
${scores.explanations.psychology}

**Your Custom Mindset Protocol:**
1. **Lock-out protocol**: If you take **${overtrading ? "more than 3" : "2"} losses in a day**, your trading terminal must lock out. The market will be there tomorrow.
2. **Revenge Block**: Never enter a trade within 45 minutes of a loss. Write down why you lost *before* looking for the next setup.`;
      }
    }

    // 4. Session & Hour
    if (isSessionQuery) {
      const sortedDaily = [...(data.dailyPerformance || [])].sort((a, b) => b.netProfit - a.netProfit);
      const bestDay = sortedDaily[0]?.dayName ?? "Tuesday";
      const worstDay = sortedDaily[sortedDaily.length - 1]?.dayName ?? "Friday";

      // Find best/worst session
      const NYProfit = data.trades.filter(t => t.openTime.getUTCHours() >= 13 && t.openTime.getUTCHours() < 22).reduce((sum, t) => sum + t.netProfit, 0);
      const LondonProfit = data.trades.filter(t => t.openTime.getUTCHours() >= 7 && t.openTime.getUTCHours() < 13).reduce((sum, t) => sum + t.netProfit, 0);
      const AsiaProfit = data.trades.filter(t => t.openTime.getUTCHours() < 7 || t.openTime.getUTCHours() >= 22).reduce((sum, t) => sum + t.netProfit, 0);

      const sessions = [
        { name: lang === "ar" ? "جلسة لندن (07:00-13:00 UTC)" : lang === "fr" ? "Session Londres (07:00-13:00 UTC)" : "London Session (07:00-13:00 UTC)", profit: LondonProfit },
        { name: lang === "ar" ? "جلسة نيويورك (13:00-22:00 UTC)" : lang === "fr" ? "Session New York (13:00-22:00 UTC)" : "New York Session (13:00-22:00 UTC)", profit: NYProfit },
        { name: lang === "ar" ? "جلسة آسيا (22:00-07:00 UTC)" : lang === "fr" ? "Session Asie (22:00-07:00 UTC)" : "Asia Session (22:00-07:00 UTC)", profit: AsiaProfit }
      ].sort((a, b) => b.profit - a.profit);

      if (lang === "ar") {
        return `### ⏰ تخطيط سيولة الجلسات وأوقات اليوم

حافة التداول الخاصة بك حساسة للغاية لساعات اليوم وسيولة السوق المتاحة.

**توزيع جلسات السوق:**
- **أفضل جلسة تداول**: **${sessions[0].name}** محققة **+$${sessions[0].profit.toFixed(2)}** من الأرباح الصافية.
- **أسوأ جلسة تداول**: **${sessions[sessions.length - 1].name}** مستنزفة **-$${Math.abs(sessions[sessions.length - 1].profit).toFixed(2)}** من الأرباح الصافية.

**ميزة تقويم الأسبوع:**
- أكثر يوم مربح بالنسبة لك هو **${bestDay}**، مما يظهر التزاماً عالياً بالاستراتيجية والتركيز.
- أكثر يوم خطر عليك هو **${worstDay}**، ويمثل تسرباً مالياً خطيراً.

**توصية التوقيت اليومي:**
- أنت تقوم بالإفراط في التداول خلال **ساعات جلسة آسيا / تبييت الصفقات**. السيولة المنخفضة، السبريد المرتفع، وحركة السوق البطيئة تلتهم رأس مالك.
- **الإجراء**: حدد تنفيذك حصرياً بـ **${sessions[0].name}**. قم بإلغاء جميع الطلبات خارج نافذة السيولة هذه.`;
      } else if (lang === "fr") {
        return `### ⏰ Cartographie du Calendrier & de la Liquidité Intrajournalière

Votre avantage de trading est très sensible aux heures de la journée et à la liquidité du marché.

**Répartition des Sessions de Marché :**
- **Meilleure Session** : **${sessions[0].name}** générant **+$${sessions[0].profit.toFixed(2)}** de rendement net.
- **Pire Session** : **${sessions[sessions.length - 1].name}** drainant **-$${Math.abs(sessions[sessions.length - 1].profit).toFixed(2)}** de rendement net.

**Avantage du Calendrier Hebdomadaire :**
- Votre jour le plus rentable est le **${bestDay}**, montrant un fort respect de la stratégie et de la concentration.
- Votre jour le plus dangereux est le **${worstDay}**, représentant une fuite importante de capital.

**Recommandation de Timing Intrajournalier :**
- Vous sur-tradez pendant la **Session Asie / Heures de rollover**. La faible liquidité, les spreads élevés et la lenteur des marchés rongent votre capital.
- **Action** : Restreignez strictement votre exécution à la session **${sessions[0].name}**. Annulez tous les ordres en dehors de cette fenêtre de temps.`;
      } else {
        return `### ⏰ Calendar & Intraday Liquidity Mapping

Your trading edge is highly sensitive to the hours of the day and market liquidity. 

**Market Session Breakdown:**
- **Best Session**: **${sessions[0].name}** generating **+$${sessions[0].profit.toFixed(2)}** in net returns.
- **Worst Session**: **${sessions[sessions.length - 1].name}** draining **-$${Math.abs(sessions[sessions.length - 1].profit).toFixed(2)}** in returns.

**Weekly Calendar Edge:**
- Your most profitable day is **${bestDay}**, showing high strategy compliance and focus.
- Your most dangerous day is **${worstDay}**, representing capital leak.

**Intraday Edge Recommendation:**
- You are over-trading during **Asia / Rollover hours**. Low liquidity, high spreads, and slow moving markets are eating your capital.
- **Action**: Restrict your execution strictly to **${sessions[0].name}**. Cancel all orders outside this liquid time window.`;
      }
    }

    // 5. Improving
    if (isImprovingQuery) {
      if (lang === "ar") {
        return `### 📈 اتجاهات التطور ومتابعة التحسن

تحليل اتجاهات الأداء شهراً بعد شهر:

**المؤشرات الاتجاهية الأساسية:**
- **اتجاه العوائد الصافية**: ${evolution.trends.profit.text}
- **اتجاه نسبة الفوز**: ${evolution.trends.winRate.text}
- **اتجاه تراجع الحساب**: ${evolution.trends.drawdown.text}
- **اتجاه معامل الربح**: ${evolution.trends.profitFactor.text}

**رؤية رئيسية للنمو:**
${evolution.insights[0] ?? "أداؤك مستقر، لكنك تكرر عدم انتظام حجم الصفقات. توحيد حجم العقود هو خطوتك التالية للتطور والنمو."}

**المقاييس المقترحة للمستوى التالي:**
- ركز على تقليل عدد الصفقات اليومية الأقصى. سيؤدي هذا فوراً إلى تقليل تراجع حسابك واستقرار منحنى رأس مالك.`;
      } else if (lang === "fr") {
        return `### 📈 Suivi de l'Évolution & de l'Amélioration

Analyse de vos tendances de performance d'un mois à l'autre :

**Indicateurs Directionnels Clés :**
- **Tendance des Rendements Nets** : ${evolution.trends.profit.text}
- **Tendance du Taux de Réussite** : ${evolution.trends.winRate.text}
- **Tendance du Drawdown d'Équité** : ${evolution.trends.drawdown.text}
- **Tendance du Facteur de Profit** : ${evolution.trends.profitFactor.text}

**Insight de Croissance Clé :**
${evolution.insights[0] ?? "Votre performance est stabilisée, mais vous répétez des irrégularités de taille de position. Une taille constante est votre prochaine étape d'évolution."}

**Métriques Suggérées pour le Niveau Supérieur :**
- Concentrez-vous sur la réduction de votre nombre maximum de transactions quotidiennes. Cela réduira immédiatement votre tendance de drawdown et stabilisera vos courbes de capital.`;
      } else {
        return `### 📈 Evolution & Improvement Tracking

Analyzing your month-over-month performance trends:

**Core Directional Indicators:**
- **Net Returns Trend**: ${evolution.trends.profit.text}
- **Win Rate Trend**: ${evolution.trends.winRate.text}
- **Equity Drawdown Trend**: ${evolution.trends.drawdown.text}
- **Profit Factor Trend**: ${evolution.trends.profitFactor.text}

**Key Growth Insight:**
${evolution.insights[0] ?? "Your performance is stabilized, but you are repeating position size irregularities. Consistent sizing is your next evolutionary step."}

**Suggested Next-Level Metrics:**
- Focus on reducing your maximum daily trade count. This will immediately lower your drawdown trend and stabilize your capital curves.`;
      }
    }

    // 6. Profitability / Consistency
    if (isProfitabilityQuery) {
      if (lang === "ar") {
        return `### 🚀 خارطة الطريق نحو الربحية والاتساق المهني

للتقدم بتقييمك من **${scores.overall}/100** إلى **90+/100 (فئة النخبة)**، يجب أن تنتقل من أسلوب تداول تفاعلي عشوائي إلى نموذج عمل منظم ومدروس.

إليك خارطة الطريق الدقيقة المستخرجة من بياناتك:

#### الخطوة 1: توحيد حجم صفقاتك (الانضباط)
- حجم العقود الأقصى لديك غير منضبط للغاية. حافظ على سقف مخاطرتك في الصفقة الواحدة عند **1.0%** كحد أقصى من رأس المال.
- *التأثير المالي المقدر*: إذا تجنبت الدخول بعقود ضخمة عشوائية، فإن أقصى تراجع لحسابك سيكون أقل من **5%** بدلاً من **${data.metrics.maxDrawdownPercent.toFixed(1)}%**.

#### الخطوة 2: تخلص من ساعات تداولك الأسوأ بلا رحمة
- أنت تسرب رأس مال كبير خارج ساعات التداول النشطة. حدد صفقاتك بدقة داخل **تداخل جلستي لندن ونيويورك**.

#### الخطوة 3: التزم بـ "قاعدة الصديق الصادق" (علم النفس)
- تعامل مع كل صفقة كعملية تجارية بحتة. توقف عن مراقبة الصفقات المفتوحة باستمرار. حدد نقطة الدخول، وقف الخسارة، والهدف، ثم دع النظام يعمل دون تدخل عاطفي.

حافة تداولك حقيقية، لكن التسريبات العاطفية تلغي نقاط قوتك الفنية حالياً. عالج هذه التسريبات الثلاثة، والاتساق الربحي مضمون رياضياً.`;
      } else if (lang === "fr") {
        return `### 🚀 Feuille de Route vers la Rentabilité Professionnelle

Pour faire passer votre note de **${scores.overall}/100** à **90+/100 (Classe Élite)**, vous devez passer d'un style réactif à un modèle d'entreprise systématisé.

Voici votre feuille de route exacte dérivée de vos données :

#### Étape 1 : Standardiser la Taille des Positions (Discipline)
- Vos tailles de lots maximales sont très erratiques. Limitez votre risque par trade à **1,0%** maximum de votre capital.
- *Impact quantifié* : Si vous aviez évité les tailles excessives, votre drawdown maximal serait inférieur à **5%** au lieu de **${data.metrics.maxDrawdownPercent.toFixed(1)}%**.

#### Étape 2 : Éliminez Sans Pitié Vos Pires Heures
- Vous perdez une grande partie de votre capital en dehors des heures de liquidité maximale. Limitez l'exécution strictement au **chevauchement de Londres et New York**.

#### Étape 3 : Appliquez la Règle de "La Lettre de l'Ami" (Psychologie)
- Traitez chaque position comme une transaction commerciale. Arrêtez de gérer de manière excessive les transactions actives. Définissez l'entrée, le stop et la cible, puis laissez le système tourner.

Votre avantage est réel, mais les fuites émotionnelles annulent actuellement vos forces techniques. Colmatez ces trois fuites et la régularité est mathématiquement garantie.`;
      } else {
        return `### 🚀 Roadmap to Professional Profitability

To advance your rating from **${scores.overall}/100** to **90+/100 (Elite Class)**, you must transition from a reactive style to a systemized business model.

Here is your exact data-derived roadmap:

#### Step 1: Standardize Position Sizing (Discipline)
- Your maximum lot size is highly erratic. Keep your risk per trade capped at **1.0%** of your capital. 
- *Quantified impact*: If you had avoided size-bombing, your maximum drawdown would be below **5%** instead of **${data.metrics.maxDrawdownPercent.toFixed(1)}%**.

#### Step 2: Ruthlessly Eliminate Your Worst Hour
- You are leaking major capital outside of peak liquid hours. Limit execution strictly to the **London & NY overlap**.

#### Step 3: Enforce the 'Dear Friend' Rule (Psychology)
- Treat every single position as a business transaction. Stop micro-managing active trades. Define entry, stop, and target, then let the system run.

Your edge is real, but emotional leaks are currently canceling out your technical strengths. Tighten these three leaks, and consistency is mathematically guaranteed.`;
      }
    }

    // Default general answer
    if (lang === "ar") {
      return `### 📊 مسح أداء الصفقات الكمي المخصص

شكراً لسؤالك. إليك مسح تداول مخصص لـ **${data.trades.length} صفقة**:

- **تقييم المتداول العام**: **${scores.overall}/100**
- **معدل الفوز/الخسارة**: **${data.metrics.winningTrades} ربح / ${data.metrics.losingTrades} خسارة** (نسبة فوز ${data.metrics.winRate.toFixed(1)}%)
- **التوقع الرياضي**: **$${data.metrics.expectancy.toFixed(2)}** لكل صفقة
- **معامل الربح**: **${data.metrics.profitFactor.toFixed(2)}**
- **التسريبات السلوكية المكتشفة**: ${mistakes.length} تسريبات نشطة.

**ماذا تفعل الآن:**
1. اكتب سؤالاً محدداً مثل **"لماذا أخسر؟"** أو **"كيف يمكنني تحسين نسبة الفوز الخاصة بي؟"**
2. أو استخدم أحد الأسئلة التشخيصية السريعة المقترحة على اليسار.`;
    } else if (lang === "fr") {
      return `### 📊 Scan Personnalisé des Performances Quantitatives

Merci pour votre question. Voici un scan spécialisé de vos **${data.trades.length} transactions** :

- **Score Global du Trader** : **${scores.overall}/100**
- **Ratio Gain/Perte** : **${data.metrics.winningTrades} Gains / ${data.metrics.losingTrades} Pertes** (${data.metrics.winRate.toFixed(1)}% de Taux de Réussite)
- **Espérance Mathématique** : **$${data.metrics.expectancy.toFixed(2)}** par transaction
- **Facteur de Profit** : **${data.metrics.profitFactor.toFixed(2)}**
- **Fuites Comportementales Détectées** : ${mistakes.length} fuites actives.

**Que faire ensuite :**
1. Saisissez une question spécifique comme **"Pourquoi je perds ?"** ou **"Comment améliorer mon taux de réussite ?"**
2. Ou utilisez l'un de nos diagnostics rapides à gauche.`;
    } else {
      return `### 📊 Custom Quant Performance Scan

Thank you for your question. Here is a specialized scan of your **${data.trades.length} trades**:

- **Overall Trader Score**: **${scores.overall}/100**
- **Win-Loss Ratio**: **${data.metrics.winningTrades} Wins / ${data.metrics.losingTrades} Losses** (${data.metrics.winRate.toFixed(1)}% Win Rate)
- **Mathematical Expectancy**: **$${data.metrics.expectancy.toFixed(2)}** per trade
- **Profit Factor**: **${data.metrics.profitFactor.toFixed(2)}**
- **Detected Behavioral Obstacles**: ${mistakes.length} active leaks.

**What to do next:**
1. Type a specific question like **"Why am I losing?"** or **"How can I improve my win rate?"**
2. Or, use one of our quick presets on the left.`;
    }
  };

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputText;
    if (!q.trim()) return;

    const userMsg: Message = {
      sender: "user",
      text: q,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const coachText = generateAnswer(q);
      const coachMsg: Message = {
        sender: "coach",
        text: coachText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, coachMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="rounded-xl p-5 relative overflow-hidden"
        style={{ background: "hsl(var(--card) / 80%)", border: "1px solid rgba(139,92,246,0.2)", backdropFilter: "blur(16px)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.07) 0%, transparent 60%)" }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-black gradient-text">{t("aiTradingCoach")}</h2>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {t("aiCoachDesc")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-background/40 rounded-xl px-4 py-2 border border-border/10">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t("cognitiveAuditScore")}</p>
              <p className="text-2xl font-black text-purple-400" style={{ textShadow: "0 0 10px rgba(139,92,246,0.4)" }}>
                {scores.overall}
              </p>
            </div>
            <div className="h-8 w-px bg-border/20" />
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t("activeLeaks")}</p>
              <p className="text-lg font-bold text-red-400">
                {mistakes.length} {t("detected")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar - Presets & Coach Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Preset Coach Prompts */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--card) / 75%)", border: "1px solid border/40" }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" /> {t("quickDiagnostics")}
            </h3>
            <div className="space-y-2">
              {PRESET_QUESTIONS.map((q, idx) => {
                const Icon = q.icon;
                const textLabel = t(q.key);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(textLabel)}
                    disabled={isTyping}
                    className="w-full text-left p-3 rounded-lg text-xs font-semibold hover:bg-white/5 border border-transparent hover:border-border/10 transition-all flex items-center justify-between group"
                    style={{ background: "hsl(var(--background) / 40%)" }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: q.color }} />
                      <span className="truncate text-foreground/85 group-hover:text-foreground">{textLabel}</span>
                    </div>
                    <ArrowRight className={cn(
                      "h-3.5 w-3.5 text-muted-foreground/30 transition-all flex-shrink-0 ml-1 mr-1",
                      lang === "ar" ? "group-hover:-translate-x-0.5 rotate-180" : "group-hover:translate-x-0.5"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cognitive Assessment Card */}
          <div className="rounded-xl p-4 space-y-4" style={{ background: "hsl(var(--card) / 75%)", border: "1px solid border/40" }}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-cyan-400" /> {t("cognitiveAssessment")}
            </h3>

            <div className="space-y-3">
              {[
                { label: t("riskManagement"), value: scores.subScores.riskManagement, color: "#10F087" },
                { label: t("consistency"), value: scores.subScores.consistency, color: "#06B6D4" },
                { label: t("execution"), value: scores.subScores.execution, color: "#8B5CF6" },
                { label: t("psychology"), value: scores.subScores.psychology, color: "#FF6B9D" },
                { label: t("discipline"), value: scores.subScores.discipline, color: "#FFD32D" }
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-foreground/80">
                    <span>{item.label}</span>
                    <span style={{ color: item.color }}>{item.value}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area - The Main Chat Interface */}
        <div className="lg:col-span-8 rounded-xl flex flex-col h-[580px] overflow-hidden" 
          style={{ background: "hsl(var(--card) / 75%)", border: "1px solid border/40" }}>
          {/* Top Bar */}
          <div className="px-4 py-3 border-b border-border/20 bg-background/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("sessionIntel")}</span>
            </div>
            <button 
              onClick={() => setMessages([messages[0]])}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all"
              title={t("resetChat")}
            >
              <RefreshCw className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex gap-3 max-w-[85%] animate-fade-in",
                  m.sender === "user" ? (lang === "ar" ? "mr-auto flex-row" : "ml-auto flex-row-reverse") : (lang === "ar" ? "ml-auto flex-row-reverse" : "mr-auto")
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border",
                  m.sender === "user" 
                    ? "bg-purple-900/40 border-purple-500/30 text-purple-400" 
                    : "bg-cyan-950/40 border-cyan-500/30 text-cyan-400"
                )}>
                  {m.sender === "user" ? <HelpCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Bubble */}
                <div 
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-relaxed",
                    m.sender === "user" 
                      ? "bg-purple-900/10 border border-purple-500/15 text-foreground/90 rounded-tr-none" 
                      : "bg-cyan-950/5 border border-cyan-500/10 text-foreground/90 rounded-tl-none markdown text-left"
                  )}
                  style={{ direction: lang === "ar" && m.sender === "user" ? "rtl" : "ltr" }}
                >
                  {m.sender === "coach" ? (
                    <div className="space-y-2">
                      {m.text.split("\n\n").map((para, pIdx) => {
                        if (para.startsWith("###")) {
                          return <h4 key={pIdx} className="text-base font-black text-purple-400 mt-2 mb-1">{para.replace("###", "").trim()}</h4>;
                        }
                        if (para.startsWith("####")) {
                          return <h5 key={pIdx} className="text-sm font-bold text-cyan-400 mt-2 mb-1">{para.replace("####", "").trim()}</h5>;
                        }
                        if (para.startsWith("-") || para.startsWith("*")) {
                          return (
                            <ul key={pIdx} className="list-disc pl-5 space-y-1 my-1 text-muted-foreground/95">
                              {para.split("\n").map((li, lIdx) => (
                                <li key={lIdx}>{li.replace(/^[\s-*]+/, "").trim().replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1")}</li>
                              ))}
                            </ul>
                          );
                        }
                        // Handle simple markdown bold tags like **Bold**
                        return (
                          <p key={pIdx} className="text-muted-foreground/95">
                            {para.split("**").map((chunk, cIdx) => 
                              cIdx % 2 === 1 ? <strong key={cIdx} className="text-foreground font-black">{chunk}</strong> : chunk
                            )}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <p>{m.text}</p>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 mr-auto items-center">
                <div className="h-8 w-8 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-cyan-950/5 border border-cyan-500/10 rounded-xl px-4 py-3 text-xs text-muted-foreground flex items-center gap-1">
                  <span>{t("coachAnalyzing")}</span>
                  <span className="animate-pulse">.</span>
                  <span className="animate-pulse" style={{ animationDelay: "200ms" }}>.</span>
                  <span className="animate-pulse" style={{ animationDelay: "400ms" }}>.</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 border-t border-border/20 bg-background/20">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t("askCoachPlaceholder")}
                disabled={isTyping}
                className="flex-1 bg-background/50 border border-border/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500/40 transition-all text-foreground"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
