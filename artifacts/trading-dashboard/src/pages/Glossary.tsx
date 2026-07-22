import { TrendingUp, TrendingDown, Target, Shield, Activity, BarChart2, Clock, DollarSign, Zap, Award, BarChart, Repeat } from "lucide-react";
import type { Language } from "@/lib/i18n";
import type { AnalysisResult } from "@/lib/tradeAnalysis";
import { cn } from "@/lib/utils";

interface GlossaryProps {
  lang: Language;
  data?: AnalysisResult | null;
  theme: "dark" | "light";
}

interface Term {
  id: string;
  icon: typeof TrendingUp;
  color: string;
  glowColor: string;
  en: { name: string; meaning: string; goodIf: string };
  ar: { name: string; meaning: string; goodIf: string };
  fr: { name: string; meaning: string; goodIf: string };
  getValue?: (d: AnalysisResult) => string;
  rateValue?: (d: AnalysisResult) => "good" | "warning" | "bad";
}

const TERMS: Term[] = [
  {
    id: "winRate",
    icon: Target,
    color: "#8B5CF6",
    glowColor: "rgba(139,92,246,0.3)",
    en: {
      name: "Win Rate",
      meaning: "The percentage of your trades that made money. If you placed 10 trades and 7 were profitable, your win rate is 70%.",
      goodIf: "Above 50% is okay. Above 60% is great. But even 40% can be profitable if your wins are bigger than your losses.",
    },
    ar: {
      name: "نسبة الفوز",
      meaning: "نسبة صفقاتك التي حققت ربحاً. مثلاً: إذا فتحت 10 صفقات وربحت 7 منها، نسبة الفوز = 70%.",
      goodIf: "أعلى من 50% مقبول. أعلى من 60% ممتاز. لكن حتى 40% يمكن أن يكون مربحاً إذا كانت أرباحك أكبر من خسائرك.",
    },
    fr: {
      name: "Taux de réussite",
      meaning: "Le pourcentage de vos trades qui ont été profitables. Si vous faites 10 trades et que 7 gagnent, votre taux est 70%.",
      goodIf: "Au-dessus de 50% est correct. Au-dessus de 60% c'est excellent. Même 40% peut être rentable si vos gains dépassent vos pertes.",
    },
    getValue: (d) => `${d.metrics.winRate.toFixed(1)}%`,
    rateValue: (d) => d.metrics.winRate >= 60 ? "good" as const : d.metrics.winRate >= 45 ? "warning" as const : "bad" as const,
  },
  {
    id: "profitFactor",
    icon: BarChart2,
    color: "#06B6D4",
    glowColor: "rgba(6,182,212,0.3)",
    en: {
      name: "Profit Factor",
      meaning: "Total money won ÷ Total money lost. A profit factor of 2.0 means you earned $2 for every $1 you lost. This is one of the most important numbers in trading.",
      goodIf: "Above 1.5 is good. Above 2.0 is excellent. Below 1.0 means you are losing money overall.",
    },
    ar: {
      name: "معامل الربح",
      meaning: "إجمالي ما كسبته ÷ إجمالي ما خسرته. معامل ربح = 2 يعني: مقابل كل 1$ خسرته، كسبت 2$. هذا من أهم الأرقام في التداول.",
      goodIf: "أعلى من 1.5 جيد. أعلى من 2.0 ممتاز. أقل من 1.0 يعني أنك تخسر في المجمل.",
    },
    fr: {
      name: "Facteur de profit",
      meaning: "Total gagné ÷ Total perdu. Un facteur de 2.0 signifie que vous avez gagné 2€ pour chaque 1€ perdu. C'est l'un des chiffres les plus importants.",
      goodIf: "Au-dessus de 1.5 c'est bien. Au-dessus de 2.0 c'est excellent. En dessous de 1.0, vous perdez de l'argent.",
    },
    getValue: (d) => d.metrics.profitFactor === Infinity ? "∞" : d.metrics.profitFactor.toFixed(2),
    rateValue: (d) => d.metrics.profitFactor >= 2 ? "good" : d.metrics.profitFactor >= 1.3 ? "warning" : "bad",
  },
  {
    id: "avgWin",
    icon: TrendingUp,
    color: "#10F087",
    glowColor: "rgba(16,240,135,0.3)",
    en: {
      name: "Average Win",
      meaning: "The average amount of money you make on a winning trade. For example, if you won $100, $150, and $200 in three trades, your average win is $150.",
      goodIf: "Should always be higher than your Average Loss. This is what makes a profitable strategy even with a lower win rate.",
    },
    ar: {
      name: "متوسط الربح",
      meaning: "متوسط المبلغ الذي تربحه في الصفقة الرابحة. مثال: إذا ربحت 100$ و150$ و200$ في 3 صفقات، متوسط ربحك = 150$.",
      goodIf: "يجب أن يكون دائماً أعلى من متوسط الخسارة. هذا ما يجعل الاستراتيجية مربحة حتى مع نسبة فوز منخفضة.",
    },
    fr: {
      name: "Gain moyen",
      meaning: "Le montant moyen que vous gagnez sur un trade gagnant. Si vous avez gagné 100€, 150€ et 200€ sur 3 trades, votre gain moyen est 150€.",
      goodIf: "Doit toujours être supérieur à votre Perte moyenne. C'est ce qui rend une stratégie rentable même avec un faible taux de réussite.",
    },
    getValue: (d) => `$${d.metrics.averageWin.toFixed(2)}`,
    rateValue: (d) => d.metrics.averageWin > Math.abs(d.metrics.averageLoss) ? "good" : d.metrics.averageWin > Math.abs(d.metrics.averageLoss) * 0.7 ? "warning" : "bad",
  },
  {
    id: "avgLoss",
    icon: TrendingDown,
    color: "#FF4757",
    glowColor: "rgba(255,71,87,0.3)",
    en: {
      name: "Average Loss",
      meaning: "The average amount of money you lose on a losing trade. Keeping this small compared to your average win is the key to long-term profitability.",
      goodIf: "Should be smaller than your Average Win. If you lose $50 on average but win $100 on average — perfect risk/reward.",
    },
    ar: {
      name: "متوسط الخسارة",
      meaning: "متوسط المبلغ الذي تخسره في الصفقة الخاسرة. إبقاؤه صغيراً مقارنة بمتوسط الربح هو مفتاح الربحية على المدى الطويل.",
      goodIf: "يجب أن يكون أصغر من متوسط الربح. إذا خسرت بمعدل 50$ وربحت بمعدل 100$ — هذه نسبة مخاطرة مثالية.",
    },
    fr: {
      name: "Perte moyenne",
      meaning: "Le montant moyen que vous perdez sur un trade perdant. Le garder petit par rapport à votre gain moyen est la clé de la rentabilité à long terme.",
      goodIf: "Doit être inférieur à votre Gain moyen. Si vous perdez en moyenne 50€ mais gagnez 100€ en moyenne — parfait.",
    },
    getValue: (d) => `$${Math.abs(d.metrics.averageLoss).toFixed(2)}`,
    rateValue: (d) => Math.abs(d.metrics.averageLoss) < d.metrics.averageWin ? "good" : Math.abs(d.metrics.averageLoss) < d.metrics.averageWin * 1.3 ? "warning" : "bad",
  },
  {
    id: "maxDrawdown",
    icon: Shield,
    color: "#F472B6",
    glowColor: "rgba(244,114,182,0.3)",
    en: {
      name: "Max Drawdown",
      meaning: "The biggest drop your account ever experienced from its highest point. If your account hit $10,000 then dropped to $7,500 before recovering — your max drawdown is $2,500 or 25%.",
      goodIf: "Below 10% is excellent. Below 20% is acceptable. Above 30% means you're taking too much risk.",
    },
    ar: {
      name: "أقصى تراجع",
      meaning: "أكبر انخفاض في حسابك من أعلى نقطة له. إذا وصل حسابك لـ10,000$ ثم انخفض لـ7,500$ قبل الارتداد — أقصى تراجع = 2,500$ أو 25%.",
      goodIf: "أقل من 10% ممتاز. أقل من 20% مقبول. أعلى من 30% يعني أنك تتحمل مخاطرة عالية جداً.",
    },
    fr: {
      name: "Drawdown maximum",
      meaning: "La plus grande chute de votre compte depuis son point le plus haut. Si votre compte atteint 10 000€ puis tombe à 7 500€ — votre drawdown max est de 2 500€ soit 25%.",
      goodIf: "En dessous de 10% c'est excellent. En dessous de 20% c'est acceptable. Au-dessus de 30%, vous prenez trop de risques.",
    },
    getValue: (d) => `$${d.metrics.maxDrawdown.toFixed(2)}`,
    rateValue: (d) => {
      const pct = d.metrics.maxDrawdownPercent || 0;
      return pct < 10 ? "good" : pct < 20 ? "warning" : "bad";
    },
  },
  {
    id: "expectancy",
    icon: Activity,
    color: "#FFD32D",
    glowColor: "rgba(255,211,45,0.3)",
    en: {
      name: "Expectancy",
      meaning: "The average amount you expect to make per trade, considering both wins and losses together. It's calculated as: (Win Rate × Avg Win) − (Loss Rate × Avg Loss).",
      goodIf: "Any positive number means your system makes money over time. The higher, the better. Negative means you are losing overall.",
    },
    ar: {
      name: "التوقع",
      meaning: "المبلغ الذي تتوقع كسبه في المتوسط لكل صفقة، مع الأخذ في الاعتبار الأرباح والخسائر معاً. الحساب: (نسبة الفوز × متوسط الربح) − (نسبة الخسارة × متوسط الخسارة).",
      goodIf: "أي رقم موجب يعني أن نظامك مربح على المدى البعيد. كلما كان أعلى كان أفضل. رقم سلبي يعني خسارة إجمالية.",
    },
    fr: {
      name: "Espérance",
      meaning: "Le montant moyen que vous espérez gagner par trade, en tenant compte des gains et des pertes. Calcul : (Taux de réussite × Gain moyen) − (Taux d'échec × Perte moyenne).",
      goodIf: "N'importe quel nombre positif signifie que votre système est rentable sur le long terme. Plus c'est élevé, mieux c'est.",
    },
    getValue: (d) => `$${d.metrics.expectancy.toFixed(2)}`,
    rateValue: (d) => d.metrics.expectancy > 5 ? "good" : d.metrics.expectancy > 0 ? "warning" : "bad",
  },
  {
    id: "riskReward",
    icon: BarChart,
    color: "#8B5CF6",
    glowColor: "rgba(139,92,246,0.3)",
    en: {
      name: "Risk/Reward Ratio",
      meaning: "How much you gain compared to how much you risk. A ratio of 1:2 means for every $1 you risk, you aim to make $2. This is your average win divided by your average loss.",
      goodIf: "Above 1:1.5 is acceptable. Above 1:2 is good. Above 1:3 is excellent. The higher the ratio, the less often you need to win.",
    },
    ar: {
      name: "نسبة المخاطرة/المكافأة",
      meaning: "كم تكسب مقابل كم تخاطر. نسبة 1:2 تعني: مقابل كل 1$ مخاطرة، تستهدف ربح 2$. هي متوسط ربحك مقسوماً على متوسط خسارتك.",
      goodIf: "فوق 1:1.5 مقبول. فوق 1:2 جيد. فوق 1:3 ممتاز. كلما كانت النسبة أعلى، كلما احتجت لنسبة فوز أقل.",
    },
    fr: {
      name: "Ratio Risque/Rendement",
      meaning: "Combien vous gagnez par rapport à combien vous risquez. Un ratio de 1:2 signifie que pour chaque 1€ risqué, vous visez 2€ de gain.",
      goodIf: "Au-dessus de 1:1.5 c'est acceptable. Au-dessus de 1:2 c'est bien. Au-dessus de 1:3 c'est excellent.",
    },
    getValue: (d) => `1:${d.metrics.riskRewardRatio.toFixed(2)}`,
    rateValue: (d) => d.metrics.riskRewardRatio >= 2 ? "good" : d.metrics.riskRewardRatio >= 1.2 ? "warning" : "bad",
  },
  {
    id: "consecutiveWins",
    icon: Award,
    color: "#10F087",
    glowColor: "rgba(16,240,135,0.3)",
    en: {
      name: "Max Consecutive Wins",
      meaning: "The longest streak of winning trades in a row. Useful to know for understanding your best performance periods and psychological confidence.",
      goodIf: "Higher is better, but don't be overconfident after a win streak — the market doesn't care about your streak.",
    },
    ar: {
      name: "أطول سلسلة انتصارات",
      meaning: "أطول تسلسل من الصفقات الرابحة المتتالية. مفيد لفهم أفضل فترات أدائك وبناء الثقة النفسية.",
      goodIf: "كلما كانت أعلى كانت أفضل، لكن لا تثق بنفسك بشكل مفرط بعد سلسلة انتصارات — السوق لا يعرف سلسلتك.",
    },
    fr: {
      name: "Série de gains max",
      meaning: "La plus longue série de trades gagnants consécutifs. Utile pour comprendre vos meilleures périodes de performance et votre confiance psychologique.",
      goodIf: "Plus c'est élevé mieux c'est, mais ne soyez pas trop confiant après une bonne série — le marché s'en moque.",
    },
    getValue: (d) => `${d.metrics.maxWinStreak}`,
    rateValue: () => "good",
  },
  {
    id: "consecutiveLosses",
    icon: Repeat,
    color: "#FF4757",
    glowColor: "rgba(255,71,87,0.3)",
    en: {
      name: "Max Consecutive Losses",
      meaning: "The longest streak of losing trades in a row. This is important for psychological preparation. Knowing this helps you stay calm during losing streaks and avoid revenge trading.",
      goodIf: "Below 3 is great. 4-6 is normal. Above 7 might mean you need to review your strategy or risk management.",
    },
    ar: {
      name: "أطول سلسلة خسائر",
      meaning: "أطول تسلسل من الصفقات الخاسرة المتتالية. هذا مهم للاستعداد النفسي. معرفة هذا الرقم يساعدك على البقاء هادئاً وتجنب التداول الانتقامي.",
      goodIf: "أقل من 3 ممتاز. 4-6 طبيعي. أعلى من 7 قد يعني أنك تحتاج لمراجعة استراتيجيتك أو إدارة مخاطرك.",
    },
    fr: {
      name: "Série de pertes max",
      meaning: "La plus longue série de trades perdants consécutifs. Important pour la préparation psychologique. Connaître ce chiffre vous aide à rester calme et éviter le trading de revanche.",
      goodIf: "En dessous de 3 c'est excellent. 4-6 est normal. Au-dessus de 7, vous devriez peut-être revoir votre stratégie.",
    },
    getValue: (d) => `${d.metrics.maxLoseStreak}`,
    rateValue: (d) => d.metrics.maxLoseStreak <= 3 ? "good" : d.metrics.maxLoseStreak <= 6 ? "warning" : "bad",
  },
  {
    id: "avgDuration",
    icon: Clock,
    color: "#06B6D4",
    glowColor: "rgba(6,182,212,0.3)",
    en: {
      name: "Average Trade Duration",
      meaning: "How long you hold a trade on average before closing it. A scalper holds trades for seconds or minutes. A swing trader holds for hours or days.",
      goodIf: "There's no perfect answer — it depends on your strategy. What matters is being consistent with your planned holding time.",
    },
    ar: {
      name: "متوسط مدة الصفقة",
      meaning: "متوسط المدة التي تحتفظ بها بالصفقة قبل إغلاقها. المتداول السريع يحتفظ لثوانٍ أو دقائق. متداول السوينج يحتفظ لساعات أو أيام.",
      goodIf: "لا توجد إجابة مثالية — يعتمد على استراتيجيتك. المهم أن تكون متسقاً مع وقت الاحتفاظ المخطط له.",
    },
    fr: {
      name: "Durée moyenne de trade",
      meaning: "Combien de temps en moyenne vous maintenez un trade ouvert. Un scalper maintient des trades pendant des secondes ou minutes. Un swing trader pendant des heures ou jours.",
      goodIf: "Il n'y a pas de réponse parfaite — ça dépend de votre stratégie. Ce qui compte c'est d'être cohérent avec votre temps de maintien planifié.",
    },
    getValue: (d) => {
      const mins = d.metrics.avgTradeDurationMinutes;
      if (mins < 60) return `${mins.toFixed(0)} min`;
      return `${(mins / 60).toFixed(1)} hr`;
    },
    rateValue: () => "good",
  },
  {
    id: "equityCurve",
    icon: Activity,
    color: "#8B5CF6",
    glowColor: "rgba(139,92,246,0.3)",
    en: {
      name: "Equity Curve",
      meaning: "A line chart showing how your account balance changed over time. A rising equity curve means your account is growing. A smooth, steady rise is the goal of every trader.",
      goodIf: "Steady upward slope = great. Sharp spikes followed by drops = too much risk. Flat or declining = strategy needs work.",
    },
    ar: {
      name: "منحنى رأس المال",
      meaning: "مخطط خطي يوضح كيف تغير رصيد حسابك بمرور الوقت. منحنى صاعد يعني نمو حسابك. الارتفاع الثابت والمتدرج هو هدف كل متداول.",
      goodIf: "ميل صعودي ثابت = ممتاز. ارتفاعات حادة يعقبها انخفاضات = مخاطرة مفرطة. ثابت أو هابط = الاستراتيجية تحتاج مراجعة.",
    },
    fr: {
      name: "Courbe d'équité",
      meaning: "Un graphique montrant comment votre solde a évolué dans le temps. Une courbe montante signifie que votre compte croît. Une montée régulière et constante est l'objectif de tout trader.",
      goodIf: "Pente montante régulière = excellent. Pics brusques suivis de chutes = trop de risque. Plat ou déclinant = la stratégie nécessite du travail.",
    },
  },
  {
    id: "netProfit",
    icon: DollarSign,
    color: "#10F087",
    glowColor: "rgba(16,240,135,0.3)",
    en: {
      name: "Net Profit",
      meaning: "Your actual take-home earnings after subtracting all losses, commissions (broker fees), and swap (overnight holding fees). This is what really matters at the end of the day.",
      goodIf: "Positive = you're making money. The higher, the better. Make sure to account for broker fees when evaluating your strategy.",
    },
    ar: {
      name: "صافي الربح",
      meaning: "أرباحك الفعلية بعد خصم جميع الخسائر والعمولات (رسوم الوسيط) والسواب (رسوم الاحتفاظ الليلي). هذا هو الرقم الأهم في نهاية المطاف.",
      goodIf: "موجب = أنت تكسب المال. كلما كان أعلى كان أفضل. تأكد من مراعاة رسوم الوسيط عند تقييم استراتيجيتك.",
    },
    fr: {
      name: "Profit net",
      meaning: "Vos gains réels après soustraction de toutes les pertes, commissions (frais du broker) et swap (frais de maintien de position). C'est ce qui compte vraiment en fin de journée.",
      goodIf: "Positif = vous gagnez de l'argent. Plus c'est élevé, mieux c'est. Assurez-vous de prendre en compte les frais du broker.",
    },
    getValue: (d) => `$${d.metrics.netProfit.toFixed(2)}`,
    rateValue: (d) => d.metrics.netProfit > 0 ? "good" : "bad",
  },
  {
    id: "commission",
    icon: Zap,
    color: "#FFD32D",
    glowColor: "rgba(255,211,45,0.3)",
    en: {
      name: "Commission",
      meaning: "Fees charged by your broker for each trade you open and close. These are direct costs that reduce your profitability. High commissions on small accounts can really hurt performance.",
      goodIf: "As low as possible. Compare it to your gross profit — if commissions are more than 10% of your gross profit, consider a broker with lower fees.",
    },
    ar: {
      name: "العمولة",
      meaning: "الرسوم التي يتقاضاها وسيطك عن كل صفقة تفتحها وتغلقها. هذه تكاليف مباشرة تقلل من ربحيتك. العمولات العالية على الحسابات الصغيرة قد تؤثر بشدة على الأداء.",
      goodIf: "منخفضة قدر الإمكان. قارنها بإجمالي ربحك — إذا كانت العمولات أكثر من 10% من إجمالي الربح، فكّر في وسيط برسوم أقل.",
    },
    fr: {
      name: "Commission",
      meaning: "Les frais facturés par votre broker pour chaque trade ouvert et fermé. Ce sont des coûts directs qui réduisent votre rentabilité. Les commissions élevées sur les petits comptes peuvent vraiment nuire.",
      goodIf: "Le plus bas possible. Comparez-la à votre profit brut — si les commissions représentent plus de 10% de votre profit brut, envisagez un broker moins cher.",
    },
    getValue: (d) => `$${d.metrics.totalCommission.toFixed(2)}`,
    rateValue: (d) => {
      const ratio = Math.abs(d.metrics.totalCommission) / (d.metrics.grossProfit || 1);
      return ratio < 0.05 ? "good" : ratio < 0.1 ? "warning" : "bad";
    },
  },
];

const RATING_CONFIG = {
  good: { label: "Good", bg: "rgba(16,240,135,0.12)", border: "rgba(16,240,135,0.3)", text: "#10F087" },
  warning: { label: "Okay", bg: "rgba(255,211,45,0.12)", border: "rgba(255,211,45,0.3)", text: "#FFD32D" },
  bad: { label: "Needs Work", bg: "rgba(255,71,87,0.12)", border: "rgba(255,71,87,0.3)", text: "#FF4757" },
};

export function Glossary({ lang, data, theme }: GlossaryProps) {
  const metrics = data?.metrics;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-xl p-5 relative overflow-hidden"
        style={{ background: "hsl(var(--card) / 80%)", border: "1px solid rgba(139,92,246,0.2)", backdropFilter: "blur(16px)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.07) 0%, transparent 60%)" }} />
        <div className="relative">
          <h2 className="text-xl font-black gradient-text mb-1">
            {lang === "ar" ? "قاموس مصطلحات التداول" : lang === "fr" ? "Glossaire des termes de trading" : "Trading Terms — Explained Simply"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {lang === "ar"
              ? "كل مصطلح موضح بلغة بسيطة، مع قيمتك الحالية ونصيحة عملية."
              : lang === "fr"
              ? "Chaque terme est expliqué simplement, avec votre valeur actuelle et un conseil pratique."
              : "Every metric explained in plain language — with your actual value and what it means for your trading."}
          </p>
        </div>
      </div>

      {/* Terms grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 stagger-children">
        {TERMS.map((term, i) => {
          const content = term[lang] || term.en;
          const userValue = metrics && term.getValue ? term.getValue(data!) : null;
          const rating = metrics && term.rateValue ? term.rateValue(data!) : null;
          const ratingConfig = rating ? RATING_CONFIG[rating] : null;
          const Icon = term.icon;

          // Advanced interactive metrics details
          const adv = metrics ? (() => {
            switch (term.id) {
              case "winRate":
                return {
                  formula: "(Winning Trades ÷ Total Trades) × 100",
                  importance: "Determines your execution accuracy. While emotionally satisfying, a high win rate is secondary to your risk-to-reward ratio.",
                  proBenchmark: "Professional Range: 45.0% – 58.0% (sustainable high-expectancy baseline)",
                  action: data!.metrics.winRate < 50
                    ? `Your current win rate is ${data!.metrics.winRate.toFixed(1)}%. Since it is under the professional average, focus on tightening entry filters. Stop chasing rapid momentum and trade strictly inside London or New York peak liquidity hours.`
                    : `Your win rate of ${data!.metrics.winRate.toFixed(1)}% is elite! Maintain this accuracy by continuing to avoid FOMO entries and keeping your trade filters consistent.`
                };
              case "profitFactor":
                return {
                  formula: "Gross Profits ÷ Gross Losses",
                  importance: "The commercial grade of your trading system. Measures return efficiency by quantifying how many dollars are earned per dollar lost.",
                  proBenchmark: "Professional Range: 1.60 – 2.50 (highly efficient and scalable)",
                  action: data!.metrics.profitFactor < 1.3
                    ? `With a profit factor of ${data!.metrics.profitFactor.toFixed(2)}, your capital is working too hard. Improve this instantly by setting a hard stop-loss and ruthlessly cutting losing trades before they cascade.`
                    : `Your profit factor is ${data!.metrics.profitFactor.toFixed(2)}. This represents exceptional edge efficiency. Keep scaling your lot sizes conservatively.`
                };
              case "avgWin":
                return {
                  formula: "Gross Profits ÷ Total Winning Trades",
                  importance: "Represents your monetization performance. Must be maximized by letting winning trends run to structural targets.",
                  proBenchmark: "Professional Range: Minimum 1.5x of your average loss",
                  action: `Your average win is $${data!.metrics.averageWin.toFixed(2)}. Ensure you are not capping your gains by closing trades early out of fear. Use a trailer or hold for target structure.`
                };
              case "avgLoss":
                return {
                  formula: "Gross Losses ÷ Total Losing Trades",
                  importance: "The absolute gatekeeper of your portfolio. Must be kept small, flat, and strictly controlled.",
                  proBenchmark: "Professional Range: Must be kept below 1% to 1.5% of overall account size",
                  action: `Your average loss is $${Math.abs(data!.metrics.averageLoss).toFixed(2)}. Make sure this does not fluctuate. Inconsistent stop-loss sizes indicate poor discipline and can ruin your expectancy.`
                };
              case "maxDrawdown":
                return {
                  formula: "The deepest trough from the peak balance point",
                  importance: "Quantifies your system risk and emotional stress threshold. Critical for capital preservation.",
                  proBenchmark: "Professional Range: Below 10.0% is institutional-grade",
                  action: `Your drawdown reached $${data!.metrics.maxDrawdown.toFixed(2)} (${(data!.metrics.maxDrawdownPercent || 0).toFixed(1)}%). If this drops further, enforce a daily loss stop of 2.0% where you immediately lock your workstation for the day.`
                };
              case "expectancy":
                return {
                  formula: "(Win Rate × Avg Win) – (Loss Rate × Avg Loss)",
                  importance: "The mathematical proof of your trading edge. A positive expectancy guarantees profitability over a large sample size.",
                  proBenchmark: "Professional Range: Positive value (>$2.00 per trade is strong)",
                  action: data!.metrics.expectancy > 0
                    ? `Your expectancy of $${data!.metrics.expectancy.toFixed(2)} per trade is positive. The math is fully on your side. Maintain strict lot consistency.`
                    : `Your expectancy of $${data!.metrics.expectancy.toFixed(2)} is negative. This means you lose capital on average on every trade. Stop trading real money immediately and tighten your stop loss parameters.`
                };
              case "riskReward":
                return {
                  formula: "Average Winning Trade ÷ Average Losing Trade",
                  importance: "The leverage that makes profitability possible even with low accuracy. A higher RR reduces the win rate required to break even.",
                  proBenchmark: "Professional Range: 1:1.5 to 1:3.0 discretionary standard",
                  action: `Your Risk/Reward is 1:${data!.metrics.riskRewardRatio.toFixed(2)}. If this is under 1.2, you are taking asymmetric risk (risking a lot to make a little). Restructure your targets immediately.`
                };
              default:
                return {
                  formula: "Contextual system tracker",
                  importance: "Supports the core performance efficiency of your trading account.",
                  proBenchmark: "Varies depending on system timeframe and holding times",
                  action: "Keep tracking your metrics to feed the AI statistics models. Consistency is the ultimate goal."
                };
            }
          })() : null;

          return (
            <div 
              key={term.id} 
              className="glossary-card animate-slide-up group cursor-pointer transition-all hover:border-purple-500/20 active:scale-[0.99] overflow-hidden" 
              style={{ animationDelay: `${i * 60}ms`, background: "hsl(var(--card) / 60%)" }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 rounded-xl p-2.5"
                  style={{ background: `${term.color}12`, border: `1px solid ${term.color}25` }}>
                  <Icon className="h-5 w-5 transition-transform group-hover:scale-105" style={{ color: term.color, filter: `drop-shadow(0 0 6px ${term.glowColor})` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm text-foreground/90 group-hover:text-foreground transition-colors">{content.name}</h3>
                    {ratingConfig && (
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                        style={{ background: ratingConfig.bg, border: `1px solid ratingConfig.border`, color: ratingConfig.text }}>
                        {ratingConfig.label}
                      </span>
                    )}
                  </div>
                  {userValue && (
                    <p className="text-base font-black mt-0.5" style={{ color: term.color, textShadow: `0 0 15px ${term.glowColor}` }}>
                      {userValue}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{content.meaning}</p>

              {/* Collapsible details for Advanced Learning Center */}
              {adv && (
                <div className="mt-3 pt-3 border-t border-border/10 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-background/40 p-2 rounded-lg border border-border/5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Formula</p>
                      <p className="font-semibold text-foreground/80 mt-0.5">{adv.formula}</p>
                    </div>
                    <div className="bg-background/40 p-2 rounded-lg border border-border/5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Benchmarking</p>
                      <p className="font-semibold text-purple-400 mt-0.5">{adv.proBenchmark}</p>
                    </div>
                  </div>

                  <div className="bg-background/40 p-2 rounded-lg border border-border/5">
                    <p className="text-[10px] uppercase font-bold text-cyan-400">Strategic Importance</p>
                    <p className="text-muted-foreground/80 mt-0.5 leading-relaxed">{adv.importance}</p>
                  </div>

                  <div className="p-2.5 rounded-lg border"
                    style={{ background: `${term.color}05`, borderColor: `${term.color}15` }}>
                    <p className="text-[10px] uppercase font-bold" style={{ color: term.color }}>Dynamic Action Plan</p>
                    <p className="text-muted-foreground/90 mt-0.5 leading-relaxed font-medium">{adv.action}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
