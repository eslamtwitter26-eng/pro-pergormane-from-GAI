import { useMemo } from "react";
import {
  Brain, TrendingUp, TrendingDown, Activity, Lightbulb, Target,
  Shield, Zap, AlertTriangle, Star, BookOpen, Heart, Award,
} from "lucide-react";
import { PsychologicalInsights } from "@/components/PsychologicalInsights";
import { SectionCard } from "@/components/SectionCard";
import type { AnalysisResult } from "@/lib/tradeAnalysis";
import type { Language } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";
import { detectSmartMistakes } from "@/lib/evolvedAnalysis";

interface PsychologyProps {
  data: AnalysisResult;
  theme: "dark" | "light";
}

/* ─────────────────────────────────────────────────────────
   Deep report generator — all content multilingual
   ───────────────────────────────────────────────────────── */
interface ReportSection {
  title: string;
  subtitle: string;
  icon: typeof Brain;
  color: string;
  rating: "excellent" | "good" | "warning" | "danger";
  points: string[];
}

function generateDeepReport(data: AnalysisResult, lang: Language): ReportSection[] {
  const m = data.metrics;
  const dir = data.directionAnalysis;
  const sessions = data.sessionPerformance;
  const daily = data.dailyPerformance;

  const bestSession = sessions.reduce((a, b) => b.netProfit > a.netProfit ? b : a, sessions[0]);
  const worstSession = sessions.reduce((a, b) => b.netProfit < a.netProfit ? b : a, sessions[0]);
  const bestDay = daily.reduce((a, b) => b.netProfit > a.netProfit ? b : a, daily[0]);

  const avgTradesPerDay = m.totalTrades / Math.max(data.dailyPerformance.length, 1);
  const rrRatio = m.riskRewardRatio;
  const winRate = m.winRate;
  const profitFactor = m.profitFactor;
  const avgDuration = m.avgTradeDurationMinutes;
  const maxLoseStreak = m.maxLoseStreak;
  const maxWinStreak = m.maxWinStreak;

  const buyDominant = dir.buyProfit > dir.sellProfit;
  const strongBias = Math.abs(dir.buyWinRate - dir.sellWinRate) > 15;
  const dominantSide = buyDominant ? (lang === "ar" ? "الشراء" : lang === "fr" ? "l'achat" : "buying") : (lang === "ar" ? "البيع" : lang === "fr" ? "la vente" : "selling");

  const londonSession = sessions.find(s => s.session === "London");
  const nySession = sessions.find(s => s.session === "New York");
  const asiaSession = sessions.find(s => s.session === "Asia");
  const smartMoneyWinRate = ((londonSession?.winRate ?? 0) + (nySession?.winRate ?? 0)) / 2;
  const tradesInKillZones = (londonSession?.trades ?? 0) + (nySession?.trades ?? 0);
  const killZonePercent = Math.round((tradesInKillZones / m.totalTrades) * 100);

  if (lang === "ar") {
    return [
      {
        title: "🧬 هويتك كمتداول — ملفك الشخصي",
        subtitle: "من أنت داخل السوق؟",
        icon: Brain,
        color: "#8B5CF6",
        rating: winRate >= 55 && profitFactor >= 1.5 ? "excellent" : winRate >= 45 ? "good" : "warning",
        points: [
          `لديك إجمالي ${m.totalTrades} صفقة بمعدل فوز ${winRate.toFixed(1)}% ومعامل ربح ${profitFactor.toFixed(2)}.`,
          winRate >= 60
            ? `نسبة الفوز العالية تدل على أنك تتقن اختيار نقاط الدخول. هذه مهارة تحتاج أن تحافظ عليها تحت الضغط.`
            : winRate >= 45
            ? `نسبتك مقبولة لكنها تحتاج تحسين. مع نسبة RR جيدة يمكنك أن تكون مربحاً حتى بنسبة 40%.`
            : `نسبة الفوز تحتاج مراجعة جدية. إما تحسين دقة الدخول أو تحسين نقاط وقف الخسارة.`,
          profitFactor >= 2
            ? `معامل الربح ${profitFactor.toFixed(2)} ممتاز جداً — يعني أرباحك ضعف خسائرك. هذه علامة نظام قوي.`
            : profitFactor >= 1.3
            ? `معامل الربح ${profitFactor.toFixed(2)} معقول. الهدف هو الوصول لـ 1.5 أو أعلى.`
            : `معامل الربح ${profitFactor.toFixed(2)} ضعيف — خسائرك تقترب من أرباحك أو تتجاوزها.`,
          m.expectancy > 0
            ? `التوقع الإيجابي ${m.expectancy.toFixed(2)}$ لكل صفقة يعني نظامك يعمل على المدى الطويل. استمر.`
            : `التوقع السلبي ${m.expectancy.toFixed(2)}$ تحذير خطير — حتى لو ربحت اليوم، النظام يخسر على المدى البعيد.`,
        ],
      },
      {
        title: "💎 تحليل SMC — أموال الكبار",
        subtitle: "هل تتداول مع السيولة أم ضدها؟",
        icon: Shield,
        color: "#06B6D4",
        rating: strongBias ? "warning" : buyDominant && dir.buyWinRate > 55 ? "good" : "warning",
        points: [
          `صفقات الشراء: ${dir.buyTrades} بنسبة فوز ${dir.buyWinRate.toFixed(1)}% — ربح ${dir.buyProfit.toFixed(2)}$`,
          `صفقات البيع: ${dir.sellTrades} بنسبة فوز ${dir.sellWinRate.toFixed(1)}% — ربح ${dir.sellProfit.toFixed(2)}$`,
          strongBias
            ? `هناك انحياز واضح نحو ${dominantSide}. في مفهوم SMC هذا يعني أنك قد تتداول دائماً مع اتجاه واحد دون مرونة. أموال الكبار تتداول في الاتجاهين حسب السيولة.`
            : `التوازن بين الشراء والبيع جيد، يدل على قراءة صحيحة لبنية السوق في الاتجاهين.`,
          `في منهج SMC، أهم مهارة هي تحديد Block Blocks الطلب والعرض. ${buyDominant ? "أداءك في الشراء أقوى — ركز على كتل الطلب الرئيسية وتأكد من تزامنها مع السيولة الخارجية." : "أداءك في البيع أقوى — ركز على كتل العرض وتتبع أين يأخذ الكبار السيولة قبل الهبوط."}`,
          `أكبر خسارة: ${m.largestLoss.toFixed(2)}$ مقابل أكبر ربح: ${m.largestWin.toFixed(2)}$. ${Math.abs(m.largestLoss) > m.largestWin ? "الخسارة الكبرى أكبر من الربح الأكبر — علامة على عدم وجود وقف خسارة واضح أو تجاوزه." : "الربح الأكبر يتجاوز الخسارة الكبرى — علامة جيدة على إدارة مخاطر معقولة."}`,
        ],
      },
      {
        title: "⚡ تحليل ICT — جلسات القنص",
        subtitle: "هل تتداول في الوقت الصحيح؟",
        icon: Zap,
        color: "#10F087",
        rating: killZonePercent >= 70 ? "excellent" : killZonePercent >= 50 ? "good" : "warning",
        points: [
          `${killZonePercent}% من صفقاتك في جلستي لندن ونيويورك (مناطق قنص الكبار).`,
          londonSession
            ? `جلسة لندن: ${londonSession.trades} صفقة — نسبة فوز ${londonSession.winRate.toFixed(1)}% — ربح ${londonSession.netProfit.toFixed(2)}$`
            : "لا بيانات كافية لجلسة لندن.",
          nySession
            ? `جلسة نيويورك: ${nySession.trades} صفقة — نسبة فوز ${nySession.winRate.toFixed(1)}% — ربح ${nySession.netProfit.toFixed(2)}$`
            : "لا بيانات كافية لجلسة نيويورك.",
          asiaSession && asiaSession.trades > 0
            ? `جلسة آسيا: ${asiaSession.trades} صفقة — نسبة فوز ${asiaSession.winRate.toFixed(1)}%. في ICT تعتبر جلسة آسيا منطقة "التجميع" والتلاعب بالسيولة — التداول فيها عالي المخاطر.`
            : "",
          killZonePercent >= 70
            ? `ممتاز! تركيزك في Kill Zones اللندنية والنيويوركية يدل على وعي عالٍ بتوقيت أموال الكبار.`
            : `ينصح في ICT بالتركيز على: فتح لندن 8-10 صباحاً GMT، بداية نيويورك 13:30-16:00 GMT. هذه هي اللحظات التي يحرك فيها الكبار السوق.`,
          `أفضل يوم تداولك هو ${bestDay?.dayName ?? "غير محدد"} بربح ${bestDay?.netProfit.toFixed(2) ?? 0}$. في ICT يُعتبر الثلاثاء والأربعاء والخميس أفضل أيام التداول.`,
        ].filter(Boolean) as string[],
      },
      {
        title: "🌊 موجات إليوت — صبرك وانضباطك",
        subtitle: "هل تصيد الموجات أم تركبها؟",
        icon: Activity,
        color: "#FFD32D",
        rating: avgDuration > 60 && m.riskRewardRatio >= 1.5 ? "good" : avgDuration < 15 ? "warning" : "good",
        points: [
          `متوسط مدة صفقاتك: ${avgDuration.toFixed(0)} دقيقة.`,
          avgDuration < 15
            ? `المدة القصيرة جداً تشير إلى تداول مبكر الخروج. في موجات إليوت، الموجة 3 (أقوى موجة) تحتاج وقتاً لتكتمل — الخروج المبكر يفوّت معظم الحركة.`
            : avgDuration < 60
            ? `مدة معتدلة. قد تكون تخرج قبل اكتمال الموجة الدافعة. حاول تحديد الموجات 1-3 وإبقاء الصفقة حتى هدف الموجة 3.`
            : `مدة صبر جيدة. المتداولون الذين يمسكون صفقاتهم عادةً يحصلون على حركات أكبر.`,
          `أطول سلسلة ربح: ${maxWinStreak} — أطول سلسلة خسارة: ${maxLoseStreak}.`,
          maxLoseStreak >= 5
            ? `سلسلة خسائر من ${maxLoseStreak} متتالية خطرة نفسياً. في موجات إليوت تحدث تصحيحات طويلة (موجات A-B-C) يجب أن توقف التداول خلالها. التوقف الإلزامي بعد 3 خسائر متتالية ضروري.`
            : `سلسلة الخسائر معقولة ولا تشير لمشكلة نفسية حادة.`,
          rrRatio >= 2
            ? `نسبة RR ${rrRatio.toFixed(2)} ممتازة — تتوافق مع مبدأ موجات إليوت في أن الموجة 3 يجب أن تكون على الأقل 1.618 من الموجة 1.`
            : `نسبة RR ${rrRatio.toFixed(2)} تحتاج تحسين. الهدف 1.5:1 على الأقل لتتوافق مع نظرية الموجات.`,
        ],
      },
      {
        title: "📊 Price Action — انضباطك التقني",
        subtitle: "هل تقرأ الشموع والهيكل بدقة؟",
        icon: TrendingUp,
        color: "#FF6B9D",
        rating: winRate >= 55 && rrRatio >= 1.5 ? "excellent" : winRate >= 45 ? "good" : "warning",
        points: [
          `متوسط الربح للصفقة الرابحة: ${m.averageWin.toFixed(2)}$ — متوسط الخسارة: ${m.averageLoss.toFixed(2)}$`,
          Math.abs(m.averageLoss) > m.averageWin
            ? `الخسائر المتوسطة أكبر من الأرباح المتوسطة — هذا يعني أنك تقطع الأرباح مبكراً وتترك الخسائر تنمو. في Price Action هذا عكس ما يجب. يجب أن تدع الأرباح تجري وتقطع الخسائر بسرعة.`
            : `الأرباح المتوسطة أكبر من الخسائر — ممتاز! هذا هو جوهر تداول Price Action الصحيح.`,
          `عدد الأدوات المتداولة: ${data.symbolPerformance.length}. ${data.symbolPerformance.length > 8 ? "التنويع الزائد يضعف التركيز. في Price Action الاحترافي، التخصص في 2-3 أدوات يعطي نتائج أفضل بكثير." : data.symbolPerformance.length <= 3 ? "التخصص في عدد محدود من الأدوات ممتاز — تعرف شخصيتها وأوقاتها." : "عدد الأدوات معقول."}`,
          `أفضل أداة: ${data.symbolPerformance.sort((a, b) => b.netProfit - a.netProfit)[0]?.symbol ?? "غير محدد"} بربح ${data.symbolPerformance[0]?.netProfit.toFixed(2) ?? 0}$. ركز عليها أكثر.`,
          m.totalCommission > 0
            ? `دفعت ${m.totalCommission.toFixed(2)}$ عمولات. إذا كانت تمثل أكثر من 10% من إجمالي أرباحك الإجمالية فهذا يستحق المراجعة.`
            : "",
        ].filter(Boolean) as string[],
      },
      {
        title: "🧠 ملفك النفسي العاطفي",
        subtitle: "ما هي المشاعر التي تحكم قراراتك؟",
        icon: Brain,
        color: "#FF4757",
        rating: m.maxDrawdownPercent > 20 ? "danger" : maxLoseStreak >= 5 ? "warning" : "good",
        points: [
          `أقصى تراجع في رأس المال: ${m.maxDrawdownPercent.toFixed(1)}%.`,
          m.maxDrawdownPercent > 25
            ? `تراجع ${m.maxDrawdownPercent.toFixed(1)}% خطير جداً. هذا يشير إلى أحد ثلاثة أشياء: مخاطرة زائدة بالحجم، غياب وقف الخسارة، أو مضاعفة الصفقات عند الخسارة (تداول الانتقام).`
            : m.maxDrawdownPercent > 10
            ? `تراجع ${m.maxDrawdownPercent.toFixed(1)}% مقبول لكن يجب مراقبته. الحد الصحي هو 5-8% كحد أقصى لأي تراجع.`
            : `تراجع صحي — هذا يدل على انضباط في إدارة المخاطر.`,
          avgTradesPerDay > 5
            ? `معدل ${avgTradesPerDay.toFixed(1)} صفقة يومياً مرتفع جداً — علامة واضحة على الإفراط في التداول (Overtrading). كل صفقة زائدة تؤدي لتعب نفسي وقرارات أسوأ.`
            : avgTradesPerDay > 3
            ? `معدل ${avgTradesPerDay.toFixed(1)} صفقة يومياً معتدل. راقب جودة كل صفقة ولا تدخل للسوق لمجرد "الحاجة للنشاط".`
            : `معدل ${avgTradesPerDay.toFixed(1)} صفقة يومياً يدل على انتقائية جيدة — المتداول الحكيم ينتظر الإعداد المثالي.`,
          maxLoseStreak >= 5
            ? `سلسلة خسائر ${maxLoseStreak} تحتاج بروتوكول واضح: توقف إلزامي بعد 3 خسائر متتالية، مراجعة السبب، ثم العودة بحجم أصغر.`
            : `سلسلة الخسائر الأقصى ${maxLoseStreak} — في الحدود المقبولة.`,
          m.totalTrades > 0 && m.maxDrawdownPercent <= 10 && winRate >= 50
            ? `نقطة قوة نفسية: تحكمك في الخسائر وانضباطك العام يشير لنضج عاطفي جيد.`
            : `العمل على الانضباط النفسي ضروري قبل التفكير في زيادة حجم الصفقات.`,
        ],
      },
      {
        title: "💪 نقاط قوتك",
        subtitle: "ما الذي تفعله بشكل جيد؟",
        icon: Star,
        color: "#10F087",
        rating: "excellent",
        points: [
          ...(winRate >= 55 ? [`نسبة فوز ${winRate.toFixed(1)}% ممتازة — دخولك دقيقة وهذا يدل على قراءة جيدة للسوق.`] : []),
          ...(profitFactor >= 1.5 ? [`معامل الربح ${profitFactor.toFixed(2)} فوق المتوسط — نظامك يولد قيمة حقيقية.`] : []),
          ...(rrRatio >= 1.5 ? [`نسبة RR ${rrRatio.toFixed(2)} تدل على أنك لا تخاطر بأكثر مما تربح.`] : []),
          ...(m.maxDrawdownPercent <= 10 ? [`تراجع منضبط ${m.maxDrawdownPercent.toFixed(1)}% يدل على إدارة مخاطر ذكية.`] : []),
          ...(maxLoseStreak <= 3 ? [`سلسلة خسائر قصيرة تدل على قدرة على إيقاف النزيف بسرعة.`] : []),
          ...(m.averageWin > Math.abs(m.averageLoss) ? [`متوسط ربحك أكبر من متوسط خسارتك — هذا الأساس الأهم.`] : []),
          ...(killZonePercent >= 60 ? [`تركيزك في جلسات لندن ونيويورك ممتاز.`] : []),
          `استمرارك في التحليل والمراجعة هو بحد ذاته نقطة قوة كبيرة.`,
        ].filter(s => s.length > 0).slice(0, 6),
      },
      {
        title: "🎯 خطة تحسينك",
        subtitle: "أين تركز جهدك القادم؟",
        icon: Target,
        color: "#FFD32D",
        rating: "warning",
        points: [
          ...(winRate < 50 ? [`اشتغل على دقة الدخول: حدد 3 شروط يجب توافرها قبل أي صفقة. قلة الصفقات = جودة أعلى.`] : []),
          ...(rrRatio < 1.5 ? [`حسّن نسبة RR: لا تفتح صفقة بـRR أقل من 1.5. الهدف على الأقل ضعف المخاطرة.`] : []),
          ...(m.maxDrawdownPercent > 15 ? [`ضع حداً أقصى للخسارة اليومية: إذا خسرت أكثر من 3% يومياً، أغلق التداول وارجع غداً.`] : []),
          ...(avgTradesPerDay > 5 ? [`قلل عدد الصفقات اليومية: الهدف 1-3 صفقات عالية الجودة فقط.`] : []),
          ...(Math.abs(m.averageLoss) > m.averageWin ? [`وسّع أهدافك ولا تخرج مبكراً: ضع TP واتركه يعمل.`] : []),
          ...(maxLoseStreak >= 5 ? [`قاعدة حديدية: بعد 3 خسائر متتالية توقف. أيضاً راجع إعدادك قبل العودة.`] : []),
          ...(killZonePercent < 60 ? [`ركز على جلستي لندن ونيويورك وتجنب التداول في آسيا إلا لأسباب قوية جداً.`] : []),
          `راجع صفقاتك الخاسرة أسبوعياً — ليس للتوبيخ بل للتعلم. كل خسارة هي درس مجاني.`,
        ].filter(s => s.length > 0).slice(0, 7),
      },
    ];
  } else if (lang === "fr") {
    return [
      {
        title: "🧬 Votre ADN de trader — Profil complet",
        subtitle: "Qui êtes-vous sur le marché ?",
        icon: Brain,
        color: "#8B5CF6",
        rating: winRate >= 55 && profitFactor >= 1.5 ? "excellent" : winRate >= 45 ? "good" : "warning",
        points: [
          `Vous avez ${m.totalTrades} trades avec un taux de réussite de ${winRate.toFixed(1)}% et un facteur de profit de ${profitFactor.toFixed(2)}.`,
          winRate >= 60
            ? `Votre taux de réussite élevé indique une excellente sélection des points d'entrée. C'est une compétence rare à conserver.`
            : winRate >= 45
            ? `Taux acceptable mais améliorable. Avec un bon R:R, on peut être profitable même à 40%.`
            : `Le taux de réussite nécessite une révision sérieuse. Améliorez la précision des entrées ou les stop-loss.`,
          profitFactor >= 2
            ? `Facteur de profit ${profitFactor.toFixed(2)} — excellent. Vos gains valent le double de vos pertes. Signe d'un système robuste.`
            : profitFactor >= 1.3
            ? `Facteur de profit ${profitFactor.toFixed(2)} — correct. Visez 1.5 ou plus.`
            : `Facteur de profit ${profitFactor.toFixed(2)} — faible. Vos pertes s'approchent de vos gains.`,
          m.expectancy > 0
            ? `Espérance positive de ${m.expectancy.toFixed(2)}$ par trade — votre système fonctionne sur la durée. Continuez.`
            : `Espérance négative de ${m.expectancy.toFixed(2)}$ — avertissement critique. Même si vous gagnez aujourd'hui, le système perd sur la durée.`,
        ],
      },
      {
        title: "💎 Analyse SMC — Argent intelligent",
        subtitle: "Tradez-vous avec la liquidité ou contre elle ?",
        icon: Shield,
        color: "#06B6D4",
        rating: strongBias ? "warning" : buyDominant && dir.buyWinRate > 55 ? "good" : "warning",
        points: [
          `Trades acheteurs: ${dir.buyTrades} — taux de réussite ${dir.buyWinRate.toFixed(1)}% — P&L ${dir.buyProfit.toFixed(2)}$`,
          `Trades vendeurs: ${dir.sellTrades} — taux de réussite ${dir.sellWinRate.toFixed(1)}% — P&L ${dir.sellProfit.toFixed(2)}$`,
          strongBias
            ? `Biais clair vers ${dominantSide}. En SMC, le "smart money" trade dans les deux directions selon la liquidité disponible. Ce biais unique peut vous exposer à des pertes dans des marchés en range.`
            : `Bon équilibre entre achats et ventes — signe d'une lecture correcte de la structure de marché.`,
          `En SMC, l'essentiel est d'identifier les Order Blocks de demande et d'offre. ${buyDominant ? "Vos achats sont plus performants — concentrez-vous sur les Order Blocks de demande et leur alignement avec la liquidité externe." : "Vos ventes sont plus performantes — pistez les Order Blocks d'offre et où le smart money prend la liquidité avant de descendre."}`,
          `Plus grande perte: ${m.largestLoss.toFixed(2)}$ vs plus grand gain: ${m.largestWin.toFixed(2)}$. ${Math.abs(m.largestLoss) > m.largestWin ? "La plus grande perte dépasse le plus grand gain — signe d'absence de stop-loss clair ou de non-respect du plan." : "Le plus grand gain dépasse la plus grande perte — bonne gestion du risque."}`,
        ],
      },
      {
        title: "⚡ Analyse ICT — Sessions de sniper",
        subtitle: "Tradez-vous au bon moment ?",
        icon: Zap,
        color: "#10F087",
        rating: killZonePercent >= 70 ? "excellent" : killZonePercent >= 50 ? "good" : "warning",
        points: [
          `${killZonePercent}% de vos trades se déroulent sur les sessions Londres et New York (Kill Zones ICT).`,
          londonSession ? `Session Londres: ${londonSession.trades} trades — ${londonSession.winRate.toFixed(1)}% de réussite — ${londonSession.netProfit.toFixed(2)}$` : "Données insuffisantes pour Londres.",
          nySession ? `Session New York: ${nySession.trades} trades — ${nySession.winRate.toFixed(1)}% de réussite — ${nySession.netProfit.toFixed(2)}$` : "Données insuffisantes pour New York.",
          asiaSession && asiaSession.trades > 0 ? `Session Asie: ${asiaSession.trades} trades. En ICT, la session asiatique est une zone de manipulation et de collecte de liquidité — trading à haut risque.` : "",
          killZonePercent >= 70
            ? `Excellent ! Votre concentration sur les Kill Zones londoniennes et new-yorkaises démontre une haute conscience du timing du smart money.`
            : `ICT recommande de se concentrer sur: l'ouverture de Londres (8h-10h GMT) et le début de New York (13h30-16h GMT). Ce sont les moments où le smart money actionne le marché.`,
          `Votre meilleur jour est ${bestDay?.dayName ?? "inconnu"} avec ${bestDay?.netProfit.toFixed(2) ?? 0}$ de profit. En ICT, mardi, mercredi et jeudi sont les meilleurs jours.`,
        ].filter(Boolean) as string[],
      },
      {
        title: "🌊 Elliott Waves — Votre patience",
        subtitle: "Surfez-vous les vagues ou les manquez-vous ?",
        icon: Activity,
        color: "#FFD32D",
        rating: avgDuration > 60 && rrRatio >= 1.5 ? "good" : avgDuration < 15 ? "warning" : "good",
        points: [
          `Durée moyenne de vos trades: ${avgDuration.toFixed(0)} minutes.`,
          avgDuration < 15
            ? `Durée très courte — signe de sorties prématurées. En Elliott, la vague 3 (la plus puissante) demande du temps. Sortir trop tôt vous prive de la majorité du mouvement.`
            : avgDuration < 60
            ? `Durée modérée. Vous sortez peut-être avant la fin de la vague impulsive. Tentez d'identifier les vagues 1-3 et maintenez jusqu'à l'objectif de la vague 3.`
            : `Bonne patience. Les traders qui tiennent leurs positions plus longtemps capturent généralement de plus grands mouvements.`,
          `Série de gains max: ${maxWinStreak} — Série de pertes max: ${maxLoseStreak}.`,
          maxLoseStreak >= 5
            ? `Une série de ${maxLoseStreak} pertes consécutives est psychologiquement dangereuse. En Elliott, les corrections (vagues A-B-C) peuvent être longues — arrêtez de trader pendant ces phases. Règle: stop obligatoire après 3 pertes consécutives.`
            : `Série de pertes dans des limites acceptables.`,
          rrRatio >= 2
            ? `R:R de ${rrRatio.toFixed(2)} — excellent. En accord avec le principe Elliott où la vague 3 = au moins 1.618 fois la vague 1.`
            : `R:R de ${rrRatio.toFixed(2)} à améliorer. Objectif: 1.5:1 minimum pour aligner avec la théorie des vagues.`,
        ],
      },
      {
        title: "📊 Price Action — Discipline technique",
        subtitle: "Lisez-vous les bougies et la structure avec précision ?",
        icon: TrendingUp,
        color: "#FF6B9D",
        rating: winRate >= 55 && rrRatio >= 1.5 ? "excellent" : winRate >= 45 ? "good" : "warning",
        points: [
          `Gain moyen par trade gagnant: ${m.averageWin.toFixed(2)}$ — Perte moyenne: ${m.averageLoss.toFixed(2)}$`,
          Math.abs(m.averageLoss) > m.averageWin
            ? `Vos pertes moyennes dépassent vos gains moyens — vous coupez les profits trop tôt et laissez courir les pertes. En Price Action, c'est l'inverse du comportement requis. Laissez courir les gagnants, coupez vite les perdants.`
            : `Gains moyens supérieurs aux pertes — excellent ! C'est l'essence du Price Action trading.`,
          `Instruments tradés: ${data.symbolPerformance.length}. ${data.symbolPerformance.length > 8 ? "Trop de diversification nuit à la concentration. En Price Action pro, la spécialisation sur 2-3 instruments donne de bien meilleurs résultats." : data.symbolPerformance.length <= 3 ? "Spécialisation sur peu d'instruments — idéal. Vous connaissez leur caractère." : "Nombre d'instruments raisonnable."}`,
          `Meilleur instrument: ${data.symbolPerformance.sort((a, b) => b.netProfit - a.netProfit)[0]?.symbol ?? "inconnu"} avec ${data.symbolPerformance[0]?.netProfit.toFixed(2) ?? 0}$ de profit. Concentrez-vous davantage sur lui.`,
        ],
      },
      {
        title: "🧠 Profil psycho-émotionnel",
        subtitle: "Quelles émotions gouvernent vos décisions ?",
        icon: Brain,
        color: "#FF4757",
        rating: m.maxDrawdownPercent > 20 ? "danger" : maxLoseStreak >= 5 ? "warning" : "good",
        points: [
          `Drawdown maximum: ${m.maxDrawdownPercent.toFixed(1)}%.`,
          m.maxDrawdownPercent > 25
            ? `Un drawdown de ${m.maxDrawdownPercent.toFixed(1)}% est très dangereux. Cela indique: sur-exposition au risque, absence de stop-loss, ou trading de revanche (revenge trading).`
            : m.maxDrawdownPercent > 10
            ? `Drawdown de ${m.maxDrawdownPercent.toFixed(1)}% acceptable mais à surveiller. L'idéal est de ne jamais dépasser 5-8%.`
            : `Drawdown sain — excellente discipline de gestion du risque.`,
          avgTradesPerDay > 5
            ? `${avgTradesPerDay.toFixed(1)} trades/jour — surtrading évident. Chaque trade de trop génère fatigue mentale et décisions de moindre qualité.`
            : avgTradesPerDay > 3
            ? `${avgTradesPerDay.toFixed(1)} trades/jour — modéré. Évaluez la qualité de chaque trade, n'entrez pas par ennui.`
            : `${avgTradesPerDay.toFixed(1)} trades/jour — sélectivité excellente. Le sage attend la configuration parfaite.`,
          maxLoseStreak >= 5
            ? `Série de pertes de ${maxLoseStreak}: établissez un protocole clair. Stop obligatoire après 3 pertes consécutives, analyse de la cause, retour avec une taille réduite.`
            : `Série de pertes max: ${maxLoseStreak} — dans les limites acceptables.`,
        ],
      },
      {
        title: "💪 Vos points forts",
        subtitle: "Ce que vous faites bien",
        icon: Star,
        color: "#10F087",
        rating: "excellent",
        points: [
          ...(winRate >= 55 ? [`Taux de réussite ${winRate.toFixed(1)}% — entrées précises et bonne lecture du marché.`] : []),
          ...(profitFactor >= 1.5 ? [`Facteur de profit ${profitFactor.toFixed(2)} — votre système génère de la valeur réelle.`] : []),
          ...(rrRatio >= 1.5 ? [`R:R de ${rrRatio.toFixed(2)} — vous ne risquez pas plus que ce que vous pouvez gagner.`] : []),
          ...(m.maxDrawdownPercent <= 10 ? [`Drawdown contrôlé ${m.maxDrawdownPercent.toFixed(1)}% — gestion du risque intelligente.`] : []),
          ...(maxLoseStreak <= 3 ? [`Série de pertes courte — vous stoppez vite les saignements.`] : []),
          ...(m.averageWin > Math.abs(m.averageLoss) ? [`Gain moyen > perte moyenne — la base la plus importante.`] : []),
          `Analyser vos trades est en soi une force majeure.`,
        ].filter(s => s.length > 0).slice(0, 6),
      },
      {
        title: "🎯 Plan d'amélioration",
        subtitle: "Où concentrer vos efforts ?",
        icon: Target,
        color: "#FFD32D",
        rating: "warning",
        points: [
          ...(winRate < 50 ? [`Travaillez la précision des entrées: définissez 3 conditions obligatoires avant chaque trade.`] : []),
          ...(rrRatio < 1.5 ? [`Améliorez le R:R: n'ouvrez jamais un trade avec R:R inférieur à 1.5.`] : []),
          ...(m.maxDrawdownPercent > 15 ? [`Fixez une limite de perte journalière: si vous perdez plus de 3%, arrêtez pour la journée.`] : []),
          ...(avgTradesPerDay > 5 ? [`Limitez à 1-3 trades de haute qualité par jour.`] : []),
          ...(Math.abs(m.averageLoss) > m.averageWin ? [`Laissez courir vos profits: placez un TP et ne touchez pas à la position.`] : []),
          ...(maxLoseStreak >= 5 ? [`Règle de fer: stop après 3 pertes consécutives. Analysez avant de reprendre.`] : []),
          ...(killZonePercent < 60 ? [`Concentrez-vous sur les sessions Londres et New York, évitez l'Asie sauf configuration très claire.`] : []),
          `Revoyez vos trades perdants chaque semaine — non pas pour vous punir, mais pour apprendre.`,
        ].filter(s => s.length > 0).slice(0, 7),
      },
    ];
  } else {
    return [
      {
        title: "🧬 Your Trader DNA — Full Profile",
        subtitle: "Who are you inside the market?",
        icon: Brain,
        color: "#8B5CF6",
        rating: winRate >= 55 && profitFactor >= 1.5 ? "excellent" : winRate >= 45 ? "good" : "warning",
        points: [
          `You have ${m.totalTrades} total trades with a ${winRate.toFixed(1)}% win rate and a ${profitFactor.toFixed(2)} profit factor.`,
          winRate >= 60
            ? `Your high win rate shows excellent entry selection — a rare skill that signals strong market-reading ability. Protect this edge under pressure.`
            : winRate >= 45
            ? `Win rate is acceptable but improvable. With solid R:R, you can be profitable even at 40%. Focus on quality over quantity.`
            : `Win rate needs serious review. Either improve entry precision or tighten your stop-losses to eliminate weak setups.`,
          profitFactor >= 2
            ? `Profit factor ${profitFactor.toFixed(2)} is excellent — your gains are worth twice your losses. This is a hallmark of a robust system.`
            : profitFactor >= 1.3
            ? `Profit factor ${profitFactor.toFixed(2)} is acceptable. Target 1.5+ for a healthy, sustainable edge.`
            : `Profit factor ${profitFactor.toFixed(2)} is weak — your losses are nearly matching or exceeding your gains.`,
          m.expectancy > 0
            ? `Positive expectancy of ${m.expectancy.toFixed(2)}$ per trade confirms your system is mathematically sound over time. Stay consistent.`
            : `Negative expectancy of ${m.expectancy.toFixed(2)}$ is a critical warning — even if you win today, the system loses long-term without changes.`,
        ],
      },
      {
        title: "💎 SMC Analysis — Smart Money Concepts",
        subtitle: "Are you trading with liquidity or against it?",
        icon: Shield,
        color: "#06B6D4",
        rating: strongBias ? "warning" : buyDominant && dir.buyWinRate > 55 ? "good" : "warning",
        points: [
          `Buy trades: ${dir.buyTrades} — win rate ${dir.buyWinRate.toFixed(1)}% — P&L ${dir.buyProfit.toFixed(2)}$`,
          `Sell trades: ${dir.sellTrades} — win rate ${dir.sellWinRate.toFixed(1)}% — P&L ${dir.sellProfit.toFixed(2)}$`,
          strongBias
            ? `You have a strong bias toward ${dominantSide}. In SMC, smart money trades both directions based on liquidity availability. A one-directional bias means you may be missing half the market's opportunities and trading against institutional flow on certain days.`
            : `Good balance between buys and sells — indicates correct reading of market structure in both directions, a key SMC skill.`,
          `In SMC, the core skill is identifying demand and supply Order Blocks. ${buyDominant ? "Your buys outperform — focus on identifying demand Order Blocks and confirm they align with external liquidity. Look for price sweeping highs before reversal." : "Your sells outperform — track supply Order Blocks and watch where smart money takes liquidity before dropping price."}`,
          `Largest loss: ${m.largestLoss.toFixed(2)}$ vs largest win: ${m.largestWin.toFixed(2)}$. ${Math.abs(m.largestLoss) > m.largestWin ? "Your biggest loss exceeds your biggest win — this signals absent or violated stop-losses, or position sizing issues on key trades." : "Your biggest win exceeds your biggest loss — good sign of reasonable risk management on peak trades."}`,
        ],
      },
      {
        title: "⚡ ICT Analysis — Kill Zone Awareness",
        subtitle: "Are you trading in smart money's active hours?",
        icon: Zap,
        color: "#10F087",
        rating: killZonePercent >= 70 ? "excellent" : killZonePercent >= 50 ? "good" : "warning",
        points: [
          `${killZonePercent}% of your trades occur during the London and New York sessions (ICT Kill Zones).`,
          londonSession ? `London session: ${londonSession.trades} trades — ${londonSession.winRate.toFixed(1)}% win rate — ${londonSession.netProfit.toFixed(2)}$ P&L` : "Insufficient data for London session.",
          nySession ? `New York session: ${nySession.trades} trades — ${nySession.winRate.toFixed(1)}% win rate — ${nySession.netProfit.toFixed(2)}$ P&L` : "Insufficient data for New York session.",
          asiaSession && asiaSession.trades > 0 ? `Asia session: ${asiaSession.trades} trades. In ICT, Asia is the "accumulation and manipulation" zone where liquidity is hunted before the real move — high-risk trading environment.` : "",
          killZonePercent >= 70
            ? `Excellent! Your concentration in London & NY Kill Zones shows sophisticated awareness of when smart money is active.`
            : `ICT recommends focusing on: London open (8-10am GMT), NY open (1:30-4pm GMT). These are when institutional players drive the real moves. Consider avoiding Asia sessions unless you have a very clear setup.`,
          `Your best performing day is ${bestDay?.dayName ?? "unknown"} with ${bestDay?.netProfit.toFixed(2) ?? 0}$ profit. ICT teachings favor Tuesday, Wednesday, and Thursday as the most reliable trading days.`,
        ].filter(Boolean) as string[],
      },
      {
        title: "🌊 Elliott Wave Mindset — Your Patience",
        subtitle: "Do you ride waves or catch them too late?",
        icon: Activity,
        color: "#FFD32D",
        rating: avgDuration > 60 && rrRatio >= 1.5 ? "good" : avgDuration < 15 ? "warning" : "good",
        points: [
          `Average trade duration: ${avgDuration.toFixed(0)} minutes.`,
          avgDuration < 15
            ? `Very short duration signals premature exits. In Elliott Wave theory, Wave 3 (the most powerful impulse) takes time to develop — exiting too early costs you most of the move.`
            : avgDuration < 60
            ? `Moderate duration. You may be exiting before the impulse wave completes. Try to identify Waves 1-3 and hold through the Wave 3 target before considering exits.`
            : `Good patience in holding trades. Traders who allow positions time to develop typically capture larger price movements.`,
          `Max win streak: ${maxWinStreak} — Max loss streak: ${maxLoseStreak}.`,
          maxLoseStreak >= 5
            ? `A ${maxLoseStreak}-trade losing streak is psychologically dangerous. In Elliott Wave, corrective phases (A-B-C waves) can be long and choppy — the discipline is to stop trading during them. Implement a hard rule: mandatory break after 3 consecutive losses.`
            : `Loss streak within acceptable limits — no red flags for impulsive recovery behavior.`,
          rrRatio >= 2
            ? `R:R of ${rrRatio.toFixed(2)} is excellent — aligns with the Elliott Wave principle that Wave 3 should extend at least 1.618x Wave 1.`
            : `R:R of ${rrRatio.toFixed(2)} needs improvement. Target 1.5:1 minimum to align with wave extension principles.`,
        ],
      },
      {
        title: "📊 Price Action Discipline",
        subtitle: "How precisely do you read candles and market structure?",
        icon: TrendingUp,
        color: "#FF6B9D",
        rating: winRate >= 55 && rrRatio >= 1.5 ? "excellent" : winRate >= 45 ? "good" : "warning",
        points: [
          `Average winning trade: ${m.averageWin.toFixed(2)}$ — Average losing trade: ${m.averageLoss.toFixed(2)}$`,
          Math.abs(m.averageLoss) > m.averageWin
            ? `Average losses exceed average wins — you are cutting profits early and letting losses grow. This is the opposite of disciplined Price Action. The golden rule: let winners run, cut losers fast.`
            : `Average wins exceed average losses — excellent! This is the core of professional Price Action trading.`,
          `Instruments traded: ${data.symbolPerformance.length}. ${data.symbolPerformance.length > 8 ? "Over-diversification weakens focus. Professional PA traders specialize in 2-3 instruments and know their personality deeply." : data.symbolPerformance.length <= 3 ? "Excellent specialization — you know your instruments well. This is the mark of a focused trader." : "Reasonable instrument count."}`,
          `Your best instrument: ${data.symbolPerformance.sort((a, b) => b.netProfit - a.netProfit)[0]?.symbol ?? "N/A"} with ${data.symbolPerformance[0]?.netProfit.toFixed(2) ?? 0}$ profit. Double down on your strengths.`,
          m.totalCommission > 0 ? `Commissions paid: ${m.totalCommission.toFixed(2)}$. If this represents more than 10% of gross profit, it's worth reviewing your trade frequency and broker costs.` : "",
        ].filter(Boolean) as string[],
      },
      {
        title: "🧠 Your Emotional Trading Profile",
        subtitle: "Which emotions are driving your decisions?",
        icon: Brain,
        color: "#FF4757",
        rating: m.maxDrawdownPercent > 20 ? "danger" : maxLoseStreak >= 5 ? "warning" : "good",
        points: [
          `Maximum account drawdown: ${m.maxDrawdownPercent.toFixed(1)}%.`,
          m.maxDrawdownPercent > 25
            ? `A ${m.maxDrawdownPercent.toFixed(1)}% drawdown is dangerously high. This typically means: over-sized positions, missing stop-losses, or revenge trading after losses (adding to losers to "recover").`
            : m.maxDrawdownPercent > 10
            ? `${m.maxDrawdownPercent.toFixed(1)}% drawdown is acceptable but needs monitoring. A healthy professional target is to never exceed 5-8% drawdown.`
            : `Healthy drawdown — excellent risk control and emotional discipline demonstrated.`,
          avgTradesPerDay > 5
            ? `${avgTradesPerDay.toFixed(1)} trades/day average is high — a clear sign of overtrading. Every unnecessary trade drains mental capital and leads to worse decision quality.`
            : avgTradesPerDay > 3
            ? `${avgTradesPerDay.toFixed(1)} trades/day — moderate. Monitor quality: don't enter the market just because you feel the need to be active.`
            : `${avgTradesPerDay.toFixed(1)} trades/day — excellent selectivity. The wise trader waits for perfect setups.`,
          maxLoseStreak >= 5
            ? `A ${maxLoseStreak}-trade losing streak demands a clear protocol: mandatory stop after 3 consecutive losses, root cause analysis, then return with reduced size.`
            : `Max losing streak of ${maxLoseStreak} — within healthy limits.`,
          m.maxDrawdownPercent <= 10 && winRate >= 50
            ? `Psychological strength point: your loss control and overall discipline suggests good emotional maturity — a rare trait in retail traders.`
            : `Working on psychological discipline is essential before increasing position sizes.`,
        ],
      },
      {
        title: "💪 Your Strengths",
        subtitle: "What you're already doing right",
        icon: Star,
        color: "#10F087",
        rating: "excellent",
        points: [
          ...(winRate >= 55 ? [`Win rate of ${winRate.toFixed(1)}% — precise entries and strong market-reading ability.`] : []),
          ...(profitFactor >= 1.5 ? [`Profit factor ${profitFactor.toFixed(2)} — your system generates real, consistent value.`] : []),
          ...(rrRatio >= 1.5 ? [`R:R of ${rrRatio.toFixed(2)} — you don't risk more than you stand to gain.`] : []),
          ...(m.maxDrawdownPercent <= 10 ? [`Controlled drawdown of ${m.maxDrawdownPercent.toFixed(1)}% — smart capital preservation.`] : []),
          ...(maxLoseStreak <= 3 ? [`Short losing streaks — you cut the bleeding quickly, a critical psychological skill.`] : []),
          ...(m.averageWin > Math.abs(m.averageLoss) ? [`Average win exceeds average loss — the single most important metric in trading.`] : []),
          ...(killZonePercent >= 60 ? [`Strong focus on London & NY sessions — aligned with institutional activity.`] : []),
          `The fact that you're reviewing and analyzing your trading data is itself a major strength — most retail traders never do this.`,
        ].filter(s => s.length > 0).slice(0, 6),
      },
      {
        title: "🎯 Your Improvement Roadmap",
        subtitle: "Where to focus your energy next",
        icon: Target,
        color: "#FFD32D",
        rating: "warning",
        points: [
          ...(winRate < 50 ? [`Improve entry precision: define 3 mandatory conditions before any trade. Fewer trades = higher quality.`] : []),
          ...(rrRatio < 1.5 ? [`Fix your R:R: never open a trade with R:R below 1.5. Target at least 2x your risk as reward.`] : []),
          ...(m.maxDrawdownPercent > 15 ? [`Set a daily loss limit: if you lose more than 3% in one day, close the platform and return tomorrow.`] : []),
          ...(avgTradesPerDay > 5 ? [`Limit yourself to 1-3 high-quality trades per day. Journaling each trade selection helps.`] : []),
          ...(Math.abs(m.averageLoss) > m.averageWin ? [`Expand your targets and stop exiting early: set TP and let it work.`] : []),
          ...(maxLoseStreak >= 5 ? [`Iron rule: mandatory break after 3 consecutive losses. Review your setup before returning.`] : []),
          ...(killZonePercent < 60 ? [`Focus on London & New York sessions. Avoid Asia unless you have a very clear, proven setup.`] : []),
          `Review your losing trades weekly — not to punish yourself, but to learn. Every loss is a free lesson.`,
        ].filter(s => s.length > 0).slice(0, 7),
      },
    ];
  }
}

function generateFriendLetter(data: AnalysisResult, lang: Language): string {
  const m = data.metrics;
  const winRate = m.winRate;
  const pf = m.profitFactor;

  if (lang === "ar") {
    return `أخي المتداول،

بصراحة تامة كما يتحدث صديق حقيقي — لقد رأيت أرقامك وأريدك أن تسمع هذا:

لديك أساس جيد. نسبة الفوز ${winRate.toFixed(1)}% ومعامل الربح ${pf.toFixed(2)} يدلان على أنك لست مبتدئاً تماماً — تفهم شيئاً من السوق. لكن الفرق بينك وبين المتداول المحترف ليس في التقنية، بل في الانضباط النفسي والمنهجية.

ما يضعفك حالياً ليس قلة المعرفة — بل كثرة القرارات العشوائية والتداول تحت الضغط العاطفي. رأيت ذلك في الأرقام.

وهنا أقول لك بصدق: لا يكفي أن تشاهد يوتيوب أو تقرأ مقالات. تحتاج منهجاً متكاملاً يعلمك ليس فقط أين تدخل، بل كيف تفكر كمحترف.

لذلك أنصحك بشدة بالانضمام إلى دورات EG-Finance Fx — هذه ليست مجرد دورة تقنية بل هي تدريب شامل على نفسية التداول، إدارة المخاطر، وأفضل المناهج العالمية من SMC وICT والبرايس أكشن. الفرق بين من تتعلم منه وبين من يعلمك هو الفرق بين الضياع والوضوح.

أنت تستحق أن تصل لمستوى أعلى. الخطوة الأولى هي أن تقرر أنك ستتعلم بشكل صحيح من المرة الأولى.

صديقك في رحلة التداول.`;
  } else if (lang === "fr") {
    return `Mon ami trader,

En toute franchise, comme un vrai ami te parlerait — j'ai vu tes chiffres et je veux que tu entendes ceci :

Tu as une base solide. Un taux de réussite de ${winRate.toFixed(1)}% et un facteur de profit de ${pf.toFixed(2)} montrent que tu n'es pas totalement débutant — tu comprends quelque chose du marché. Mais la différence entre toi et un trader professionnel ne tient pas à la technique, elle tient à la discipline psychologique et à la méthodologie.

Ce qui te freine actuellement, ce n'est pas le manque de connaissance — c'est la prise de décisions impulsives et le trading sous pression émotionnelle. J'ai vu ça dans les chiffres.

Et là, je te dis honnêtement : regarder YouTube ou lire des articles ne suffit pas. Tu as besoin d'une méthodologie complète qui t'apprend non seulement où entrer, mais comment penser comme un professionnel.

C'est pourquoi je te recommande vivement de rejoindre les formations EG-Finance Fx — ce n'est pas juste une formation technique, c'est un entraînement complet sur la psychologie du trading, la gestion du risque, et les meilleures méthodes mondiales (SMC, ICT, Price Action). La différence entre apprendre seul et apprendre avec un vrai mentor, c'est la différence entre l'errance et la clarté.

Tu mérites d'atteindre un niveau supérieur. La première étape est de décider d'apprendre correctement, dès maintenant.

Ton ami dans ce voyage de trading.`;
  } else {
    return `My fellow trader,

In complete honesty, as a real friend would speak to you — I've seen your numbers and I want you to hear this:

You have a genuine foundation. A win rate of ${winRate.toFixed(1)}% and a profit factor of ${pf.toFixed(2)} show you're not completely lost — you understand something about the market. But the gap between you and a professional trader isn't technical knowledge. It's psychological discipline and systematic methodology.

What's holding you back right now isn't lack of knowledge — it's the impulsive decisions, the emotional trading under pressure, and the lack of a repeatable process. I can see it in your numbers.

And here I'll be straight with you: watching YouTube and reading articles isn't enough. You need a complete, structured curriculum that teaches you not just where to enter, but how to think like a professional — how to manage your mind, your risk, and your plan simultaneously.

This is why I strongly recommend joining EG-Finance Fx courses. This isn't just a technical course — it's comprehensive training covering trading psychology, risk management, and the world's leading methodologies: SMC, ICT, Elliott Wave, and Price Action, all in one place with real mentorship. The difference between figuring it out alone and learning from proven professionals is the difference between years of losses and accelerated growth.

You deserve to reach a higher level. The first step is deciding to learn correctly, starting now.

Your friend on this trading journey.`;
  }
}

const RATING_COLORS = {
  excellent: "#10F087",
  good: "#06B6D4",
  warning: "#FFD32D",
  danger: "#FF4757",
};

const RATING_LABELS = {
  en: { excellent: "Excellent", good: "Good", warning: "Needs Work", danger: "Critical" },
  ar: { excellent: "ممتاز", good: "جيد", warning: "يحتاج تحسين", danger: "حرج" },
  fr: { excellent: "Excellent", good: "Bon", warning: "À améliorer", danger: "Critique" },
};

/* ──────────────────────────────────────────
   Component
   ────────────────────────────────────────── */
export function Psychology({ data, theme }: PsychologyProps) {
  const { lang, t } = useI18n();
  const sections = useMemo(() => generateDeepReport(data, lang), [data, lang]);
  const letter = useMemo(() => generateFriendLetter(data, lang), [data, lang]);
  const mistakes = useMemo(() => detectSmartMistakes(data.trades, data.metrics, lang), [data, lang]);

  const detected = data.psychologicalInsights.filter(i => i.detected);
  const clean = data.psychologicalInsights.filter(i => !i.detected);

  const scoreColor = detected.length === 0
    ? "#10F087" : detected.some(i => i.severity === "high")
    ? "#FF4757" : "#FFD32D";

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header banner */}
      <div className="rounded-xl p-5 relative overflow-hidden"
        style={{ background: "hsl(var(--card) / 80%)", border: "1px solid rgba(139,92,246,0.2)", backdropFilter: "blur(16px)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.06) 0%, transparent 60%)" }} />
        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0 rounded-2xl p-3"
            style={{ background: `${scoreColor}15`, border: `1px solid ${scoreColor}30` }}>
            <Brain className="h-8 w-8" style={{ color: scoreColor, filter: `drop-shadow(0 0 8px ${scoreColor}80)` }} />
          </div>
          <div>
            <h2 className="text-xl font-black gradient-text">{t("psych_title")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("psych_subtitle")}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold" style={{ color: scoreColor }}>
                {detected.length === 0 ? t("psych_excellent") : detected.some(i => i.severity === "high") ? t("psych_needsAttention") : t("psych_improve")}
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-sm text-muted-foreground">
                {detected.length > 0
                  ? `${detected.length} ${t("psych_patternsDetected")}`
                  : t("psych_noNegative")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Target, label: t("psych_totalPatterns"), value: data.psychologicalInsights.length, color: "#8B5CF6" },
          { icon: TrendingDown, label: t("psych_issuesFound"), value: detected.length, color: detected.length === 0 ? "#10F087" : "#FF4757" },
          { icon: TrendingUp, label: t("psych_cleanAreas"), value: clean.length, color: "#10F087" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="rounded-xl p-4 text-center animate-slide-up"
              style={{ background: "hsl(var(--card) / 75%)", border: `1px solid ${item.color}20`, backdropFilter: "blur(16px)", animationDelay: `${i * 80}ms` }}>
              <Icon className="h-5 w-5 mx-auto mb-2" style={{ color: item.color, filter: `drop-shadow(0 0 5px ${item.color}60)` }} />
              <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 uppercase tracking-wide">{item.label}</p>
            </div>
          );
        })}
      </div>

      {/* Deep Report Sections */}
      {sections.map((section, idx) => {
        const Icon = section.icon;
        const ratingColor = RATING_COLORS[section.rating];
        const ratingLabel = RATING_LABELS[lang][section.rating];
        return (
          <div key={idx} className="rounded-xl overflow-hidden animate-slide-up"
            style={{ background: "hsl(var(--card) / 80%)", border: `1px solid ${section.color}20`, backdropFilter: "blur(16px)", animationDelay: `${idx * 60}ms` }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: `${section.color}15`, background: `${section.color}08` }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                style={{ background: `${section.color}15`, border: `1px solid ${section.color}30` }}>
                <Icon className="h-4 w-4" style={{ color: section.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground leading-tight">{section.title}</h3>
                <p className="text-[11px] text-muted-foreground/60">{section.subtitle}</p>
              </div>
              <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: ratingColor, background: `${ratingColor}15`, border: `1px solid ${ratingColor}30` }}>
                {ratingLabel}
              </span>
            </div>
            <div className="p-4 space-y-2">
              {section.points.map((point, pi) => (
                <div key={pi} className="flex items-start gap-3 rounded-lg p-2.5"
                  style={{ background: `${section.color}05` }}>
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black mt-0.5"
                    style={{ background: `${section.color}20`, color: section.color, border: `1px solid ${section.color}30` }}>
                    {pi + 1}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Psychological patterns */}
      <SectionCard title={t("psychologicalInsights")} accentColor="purple">
        <PsychologicalInsights insights={data.psychologicalInsights} lang={lang} />
      </SectionCard>

      {/* Smart Mistake Detection & Behavioral Leaks */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: "hsl(var(--card) / 75%)", border: "1px solid border/40" }}>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4.5 w-4.5 text-red-400 animate-pulse" /> {
              lang === "ar" ? "كشف التسربات السلوكية والانحيازات المعرفية" :
              lang === "fr" ? "Détection des Fuites Comportementales & Biais Cognitifs" :
              "Behavioral Leak & Cognitive Bias Detection"
            }
          </h3>
          <p className="text-xs text-foreground/80 mt-1">
            {
              lang === "ar" ? "التنقيب الذكي في سجلات التداول للكشف عن أخطاء التنفيذ التلقائية والمحفزات العاطفية." :
              lang === "fr" ? "Analyse intelligente des journaux de trading pour découvrir les erreurs d'exécution automatisées et les déclencheurs émotionnels." :
              "Intelligent pattern mining of trade logs to uncover automated execution errors and emotional triggers."
            }
          </p>
        </div>

        {mistakes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mistakes.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl space-y-3 bg-background/40 border border-border/10 flex flex-col justify-between animate-fade-in">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-foreground">{m.title}</span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                      m.severity === "high" 
                        ? "bg-red-500/10 text-red-400 border-red-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {
                        lang === "ar" ? `خطورة ${m.severity === "high" ? "عالية" : m.severity === "medium" ? "متوسطة" : "منخفضة"}` :
                        lang === "fr" ? `Gravité ${m.severity === "high" ? "élevée" : m.severity === "medium" ? "moyenne" : "faible"}` :
                        `${m.severity} severity`
                      }
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed mt-2">{m.description}</p>
                  
                  <div className="mt-3 p-2 rounded-lg bg-background/60 border border-border/5 text-[11px] text-foreground/90 font-medium">
                    🔎 <span className="font-bold text-foreground">
                      {lang === "ar" ? "الدليل:" : lang === "fr" ? "Preuve:" : "Evidence:"}
                    </span> {m.evidence}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/5 flex items-center justify-between text-[11px]">
                  <span className="text-foreground/70">
                    {lang === "ar" ? "التكرار:" : lang === "fr" ? "Fréquence:" : "Frequency:"} <strong className="text-foreground">{m.frequency.toFixed(1)}%</strong>
                  </span>
                  <span className="text-cyan-400 font-semibold cursor-help" title={m.suggestedFix}>
                    💡 {lang === "ar" ? "الحل المقترح" : lang === "fr" ? "Solution Suggérée" : "Suggested Fix"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-background/20 border border-border/10 text-xs text-muted-foreground text-center">
            {
              lang === "ar" ? "لم يتم اكتشاف أي أنماط سلوكية سلبية واضحة (كالتداول الانتقامي، أو مضاعفة حجم العقود، أو الإفراط في التداول) في هذه البيانات. تحكم معرفي مميز بالذات!" :
              lang === "fr" ? "Aucun groupe de comportements négatifs distincts (trading de revanche, doublement de taille, sur-trading) détecté dans ces données. Maîtrise de soi cognitive exceptionnelle !" :
              "No distinct negative behavioral clusters (revenge-trading, size-doubling, over-trading) detected in this dataset. Outstanding cognitive self-control!"
            }
          </div>
        )}
      </div>

      {/* Dear Friend Letter */}
      <div className="rounded-xl overflow-hidden"
        style={{ background: "hsl(var(--card) / 90%)", border: "1px solid rgba(255,107,157,0.25)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "rgba(255,107,157,0.15)", background: "rgba(255,107,157,0.05)" }}>
          <Heart className="h-5 w-5 flex-shrink-0" style={{ color: "#FF6B9D" }} />
          <div>
            <h3 className="font-bold text-sm" style={{ color: "#FF6B9D" }}>
              {lang === "ar" ? "رسالة صديق" : lang === "fr" ? "Lettre d'un ami" : "A Letter from a Friend"}
            </h3>
            <p className="text-[11px] text-muted-foreground/60">
              {lang === "ar" ? "نصيحة صادقة من شخص يريد نجاحك" : lang === "fr" ? "Conseil sincère d'un ami qui veut votre succès" : "Honest advice from someone who wants you to succeed"}
            </p>
          </div>
          <div className="ml-auto">
            <Award className="h-5 w-5" style={{ color: "#FFD32D" }} />
          </div>
        </div>
        <div className="p-5">
          <pre className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
            {letter}
          </pre>
        </div>
      </div>

      {/* Pro tip */}
      <div className="rounded-xl p-4" style={{ background: "rgba(16,240,135,0.04)", border: "1px solid rgba(16,240,135,0.15)" }}>
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#10F087" }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: "#10F087" }}>{t("psych_proTip")}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("psych_proTipText")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
