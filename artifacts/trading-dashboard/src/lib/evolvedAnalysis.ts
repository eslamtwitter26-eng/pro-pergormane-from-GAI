import { Trade, PerformanceMetrics, DailyPerformance, HourlyPerformance, MonthlyPerformance } from "./tradeAnalysis";

export interface SubScores {
  riskManagement: number;
  consistency: number;
  execution: number;
  psychology: number;
  discipline: number;
}

export interface TraderScoreResult {
  overall: number;
  subScores: SubScores;
  explanations: {
    overall: string;
    riskManagement: string;
    consistency: string;
    execution: string;
    psychology: string;
    discipline: string;
  };
}

export interface EvolutionPeriod {
  periodLabel: string; // e.g., "Feb 2026", "Week 12", etc.
  tradesCount: number;
  winRate: number;
  drawdown: number;
  profit: number;
  expectancy: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  riskReward: number;
}

export interface EvolutionTrackingResult {
  byMonth: EvolutionPeriod[];
  byWeek: EvolutionPeriod[];
  trends: {
    winRate: { direction: "up" | "down" | "flat"; percentChange: number; text: string };
    profit: { direction: "up" | "down" | "flat"; percentChange: number; text: string };
    drawdown: { direction: "up" | "down" | "flat"; percentChange: number; text: string };
    expectancy: { direction: "up" | "down" | "flat"; percentChange: number; text: string };
    profitFactor: { direction: "up" | "down" | "flat"; percentChange: number; text: string };
  };
  insights: string[];
}

export interface TradingGoal {
  id: string;
  type: 
    | "max_drawdown"
    | "max_daily_loss"
    | "max_trades_per_day"
    | "min_win_rate"
    | "min_profit_factor"
    | "no_friday_trading"
    | "no_after_london"
    | "risk_per_trade";
  title: string;
  targetValue: number;
  currentValue: number;
  isCustom?: boolean;
  status: "passed" | "failed" | "active";
  evidence: string;
  metricLabel: string;
}

export interface SmartMistake {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  frequency: number; // Percentage of trades/days where this occurred
  evidence: string;
  suggestedFix: string;
}

export interface ProfitablePattern {
  type: "positive" | "negative";
  category: string;
  title: string;
  evidence: string;
  metrics: string;
}

export interface TradeComparisonGroup {
  count: number;
  avgProfit: number;
  avgDurationMinutes: number;
  avgLots: number;
  winRate: number;
  buyRatio: number;
  commonHour: number;
  commonDay: string;
  commonSymbol: string;
  avgSwap: number;
}

export interface BestVsWorstResult {
  top10: TradeComparisonGroup;
  top25: TradeComparisonGroup;
  worst10: TradeComparisonGroup;
  worst25: TradeComparisonGroup;
  conclusions: string[];
  bestSession?: string;
  worstSession?: string;
  bestExplanation?: string;
}

export interface SimulationRules {
  riskPercent?: number; // scale losses/wins based on 1% risk of a starting balance
  skipFridays: boolean;
  stopLossLimit: number; // stop trading on any day after N consecutive losses
  onlyLondon: boolean;
  minRRMultiplier?: number; // e.g., 2.0 (filters out trades with reward/risk less than 1:2)
  ignoreAfterHour?: number; // e.g., 20 (ignore trades after 8 PM)
}

export interface SimulationResult {
  original: {
    netProfit: number;
    winRate: number;
    profitFactor: number;
    expectancy: number;
    totalTrades: number;
    maxDrawdown: number;
  };
  simulated: {
    netProfit: number;
    winRate: number;
    profitFactor: number;
    expectancy: number;
    totalTrades: number;
    maxDrawdown: number;
  };
  diffs: {
    netProfit: number;
    winRate: number;
    profitFactor: number;
    expectancy: number;
    totalTrades: number;
  };
  insights: string[];
}

/* ─────────────────────────────────────────────────────────
   1. TRADER SCORE ENGINE
   ───────────────────────────────────────────────────────── */
export function calculateTraderScore(trades: Trade[], metrics: PerformanceMetrics, lang: string = "en"): TraderScoreResult {
  if (!trades || trades.length === 0) {
    return {
      overall: 50,
      subScores: { riskManagement: 50, consistency: 50, execution: 50, psychology: 50, discipline: 50 },
      explanations: { overall: "", riskManagement: "", consistency: "", execution: "", psychology: "", discipline: "" }
    };
  }

  // A. Risk Management Score (0 - 100)
  let riskManagement = 70;
  if (metrics.profitFactor > 1.8) riskManagement += 15;
  else if (metrics.profitFactor > 1.2) riskManagement += 5;
  else if (metrics.profitFactor < 0.9) riskManagement -= 20;

  if (metrics.maxDrawdownPercent > 20) riskManagement -= 25;
  else if (metrics.maxDrawdownPercent > 10) riskManagement -= 15;
  else if (metrics.maxDrawdownPercent < 5) riskManagement += 15;

  const largestLossToAvgRatio = metrics.averageLoss !== 0 ? Math.abs(metrics.largestLoss / metrics.averageLoss) : 1;
  if (largestLossToAvgRatio > 5) riskManagement -= 15;
  else if (largestLossToAvgRatio < 2.5) riskManagement += 10;
  riskManagement = Math.max(10, Math.min(100, riskManagement));

  // B. Consistency Score (0 - 100)
  let consistency = 65;
  const streakRatio = metrics.maxLoseStreak > 0 ? metrics.maxWinStreak / metrics.maxLoseStreak : 1;
  if (streakRatio > 2) consistency += 15;
  else if (streakRatio < 0.5) consistency -= 15;

  if (metrics.winRate > 55) consistency += 15;
  else if (metrics.winRate > 45) consistency += 5;
  else if (metrics.winRate < 35) consistency -= 15;

  if (trades.length > 50) consistency += 5;
  consistency = Math.max(10, Math.min(100, consistency));

  // C. Execution Score (0 - 100)
  let execution = 60;
  const rr = metrics.riskRewardRatio;
  if (rr >= 2.5) execution += 25;
  else if (rr >= 1.5) execution += 15;
  else if (rr >= 1.0) execution += 5;
  else execution -= 20;

  if (metrics.expectancy > 10) execution += 15;
  else if (metrics.expectancy > 0) execution += 5;
  else execution -= 15;
  execution = Math.max(10, Math.min(100, execution));

  // D. Psychology Score (0 - 100)
  let psychology = 70;
  
  const winners = trades.filter(t => t.netProfit > 0);
  const losers = trades.filter(t => t.netProfit < 0);
  const avgWinDur = winners.length > 0 ? winners.reduce((sum, t) => sum + t.durationMinutes, 0) / winners.length : 1;
  const avgLossDur = losers.length > 0 ? losers.reduce((sum, t) => sum + t.durationMinutes, 0) / losers.length : 1;

  if (avgLossDur > avgWinDur * 2.0) {
    psychology -= 25;
  } else if (avgWinDur > avgLossDur * 1.5) {
    psychology += 15;
  }

  let revengeCount = 0;
  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1];
    const curr = trades[i];
    if (prev.netProfit < 0) {
      const diffMin = (curr.openTime.getTime() - prev.closeTime.getTime()) / 60000;
      if (diffMin > 0 && diffMin <= 15) {
        revengeCount++;
      }
    }
  }
  const revengeRate = trades.length > 0 ? revengeCount / trades.length : 0;
  if (revengeRate > 0.15) psychology -= 20;
  else if (revengeRate > 0.05) psychology -= 10;
  else psychology += 10;

  psychology = Math.max(10, Math.min(100, psychology));

  // E. Discipline Score (0 - 100)
  let discipline = 75;
  const lotSizes = trades.map(t => t.volume);
  const avgLot = lotSizes.reduce((sum, l) => sum + l, 0) / lotSizes.length;
  const maxLot = Math.max(...lotSizes);
  if (maxLot > avgLot * 4) discipline -= 25;
  else if (maxLot > avgLot * 2) discipline -= 10;
  else discipline += 15;

  const tradesByDay = new Map<string, number>();
  for (const t of trades) {
    const dateStr = t.openTime.toDateString();
    tradesByDay.set(dateStr, (tradesByDay.get(dateStr) || 0) + 1);
  }
  const overtradingDays = Array.from(tradesByDay.values()).filter(count => count > 8).length;
  if (overtradingDays > 3) discipline -= 15;
  else if (overtradingDays === 0) discipline += 10;

  discipline = Math.max(10, Math.min(100, discipline));

  // Overall Score
  const overall = Math.round(
    riskManagement * 0.30 +
    consistency * 0.20 +
    execution * 0.20 +
    psychology * 0.15 +
    discipline * 0.15
  );

  // Translate labels based on lang
  const getCategoryLabel = (cat: string) => {
    if (lang === "ar") {
      switch (cat) {
        case "Risk Management": return "إدارة المخاطر";
        case "Consistency": return "الاتساق والانتظام";
        case "Execution": return "دقة التنفيذ";
        case "Psychology": return "علم نفس التداول";
        case "Discipline": return "الانضباط وحجم الصفقات";
        default: return cat;
      }
    } else if (lang === "fr") {
      switch (cat) {
        case "Risk Management": return "Gestion du risque";
        case "Consistency": return "Régularité";
        case "Execution": return "Exécution";
        case "Psychology": return "Psychologie";
        case "Discipline": return "Discipline";
        default: return cat;
      }
    }
    return cat;
  };

  const getRatingText = (score: number) => {
    if (lang === "ar") {
      return score >= 80 ? "متداول من فئة المحترفين" :
             score >= 70 ? "متداول متقدم متناسق الأداء" :
             score >= 55 ? "متداول مبتدئ ذو أسس قوية" :
             "متداول ذو مخاطر عالية يحتاج إلى تعديلات استراتيجية";
    } else if (lang === "fr") {
      return score >= 80 ? "Trader de classe professionnelle" :
             score >= 70 ? "Trader avancé régulier" :
             score >= 55 ? "Trader en développement avec des bases solides" :
             "Trader à haut risque nécessitant une révision stratégique";
    } else {
      return score >= 80 ? "Professional Class Trader" :
             score >= 70 ? "Consistent Advanced Trader" :
             score >= 55 ? "Developing Trader with solid foundations" :
             "High-Risk Trader needing strategic overhauls";
    }
  };

  const sortedCategories = [
    { name: "Risk Management", val: riskManagement },
    { name: "Consistency", val: consistency },
    { name: "Execution", val: execution },
    { name: "Psychology", val: psychology },
    { name: "Discipline", val: discipline }
  ].sort((a, b) => b.val - a.val);

  const bestCat = getCategoryLabel(sortedCategories[0].name);
  const worstCat = getCategoryLabel(sortedCategories[4].name);
  const ratingLabel = getRatingText(overall);

  let overallExpl = "";
  if (lang === "ar") {
    overallExpl = `إن تقييمك الإجمالي البالغ ${overall}/100 يضعك في فئة "${ratingLabel}". وتكمن نقاط قوتك الأساسية في "${bestCat}"، في حين أن أكبر مجال للنمو والتحسن هو في "${worstCat}".`;
  } else if (lang === "fr") {
    overallExpl = `Votre note globale de ${overall}/100 vous positionne comme un "${ratingLabel}". Vos principaux points forts résident dans votre "${bestCat}", tandis que votre plus grande marge de progression se trouve dans votre "${worstCat}".`;
  } else {
    overallExpl = `Your overall rating of ${overall}/100 places you as a ${ratingLabel}. Your primary strengths lie in your ${bestCat}, while your greatest room for growth is in your ${worstCat}.`;
  }

  let riskExpl = "";
  if (lang === "ar") {
    riskExpl = riskManagement >= 80
      ? `معايير مخاطر استثنائية. تراجعك الأقصى محتوًى بشكل ممتاز عند ${metrics.maxDrawdownPercent.toFixed(1)}%، وعامل ربحك البالغ ${metrics.profitFactor.toFixed(2)} يظهر مرونة دفاعية عالية.`
      : riskManagement >= 60
      ? `تحكم مقبول في المخاطر. ومع ذلك، فإن أكبر خسارة لك البالغة $${Math.abs(metrics.largestLoss).toFixed(2)} هي أكبر بمقدار ${largestLossToAvgRatio.toFixed(1)} ضعفاً من متوسط خسارتك ($${Math.abs(metrics.averageLoss).toFixed(2)}). يجب احتواء الخسائر الكبيرة في الصفقة الواحدة.`
      : `تم اكتشاف تعرض لمخاطر عالية. تراجعك البالغ ${metrics.maxDrawdownPercent.toFixed(1)}% خطير، ومتوسط خسارتك ($${Math.abs(metrics.averageLoss).toFixed(2)}) ثقيل مقارنة بعامل ربحك. التزم بوضع حد الخسارة (Stop Loss) بصرامة.`;
  } else if (lang === "fr") {
    riskExpl = riskManagement >= 80
      ? `Paramètres de risque exceptionnels. Votre drawdown maximum est extrêmement bien contenu à ${metrics.maxDrawdownPercent.toFixed(1)}%, et votre facteur de profit de ${metrics.profitFactor.toFixed(2)} démontre une grande résilience défensive.`
      : riskManagement >= 60
      ? `Contrôle des risques acceptable. Cependant, votre plus grande perte de $${Math.abs(metrics.largestLoss).toFixed(2)} est ${largestLossToAvgRatio.toFixed(1)}x supérieure à votre perte moyenne ($${Math.abs(metrics.averageLoss).toFixed(2)}). Limitez les pertes extrêmes sur un seul trade.`
      : `Exposition au risque élevée détectée. Votre drawdown de ${metrics.maxDrawdownPercent.toFixed(1)}% est dangereux, et votre perte moyenne ($${Math.abs(metrics.averageLoss).toFixed(2)}) est lourde par rapport à votre facteur de profit. Utilisez strictement des stop loss.`;
  } else {
    riskExpl = riskManagement >= 80
      ? `Exceptional risk parameters. Your maximum drawdown is extremely well contained at ${metrics.maxDrawdownPercent.toFixed(1)}%, and your profit factor of ${metrics.profitFactor.toFixed(2)} demonstrates high defensive resilience.`
      : riskManagement >= 60
      ? `Acceptable risk control. However, your largest loss of $${Math.abs(metrics.largestLoss).toFixed(2)} is ${largestLossToAvgRatio.toFixed(1)}x greater than your average loss ($${Math.abs(metrics.averageLoss).toFixed(2)}). Contain single-trade tail losses.`
      : `High risk exposure detected. Your drawdown of ${metrics.maxDrawdownPercent.toFixed(1)}% is dangerous, and your average loss ($${Math.abs(metrics.averageLoss).toFixed(2)}) is heavy relative to your profit factor. Strictly employ stop losses.`;
  }

  let consistencyExpl = "";
  if (lang === "ar") {
    consistencyExpl = consistency >= 80
      ? `اتساق ممتاز في الأداء. نسبة فوزك البالغة ${metrics.winRate.toFixed(1)}% مدعومة بأعداد صفقات مستقرة ونسبة قوية لسلسلة الانتصارات إلى الخسائر البالغة ${streakRatio.toFixed(1)}.`
      : consistency >= 60
      ? `اتساق متوسط. أداؤك مشتت بعض الشيء. نسبة فوزك تتقلب، وأنت عرضة لتراكم الخسائر المتتالية (${metrics.maxLoseStreak} خسائر متتالية).`
      : `اتساق عشوائي ومتقلب. تقلبات عالية في العوائد وانخفاض نسبة الفوز الإجمالية إلى ${metrics.winRate.toFixed(1)}% يشيران إلى غياب نموذج تنفيذ موحد.`;
  } else if (lang === "fr") {
    consistencyExpl = consistency >= 80
      ? `Excellente régularité des performances. Votre taux de réussite de ${metrics.winRate.toFixed(1)}% est soutenu par un nombre de trades stable et un ratio robuste de séries de gains/pertes de ${streakRatio.toFixed(1)}.`
      : consistency >= 60
      ? `Régularité modérée. Vos performances sont quelque peu dispersées. Votre taux de réussite fluctue et vous êtes sensible à des cumuls de pertes consécutives (${metrics.maxLoseStreak} pertes d'affilée).`
      : `Régularité erratique. Une forte fluctuation des rendements et un faible taux de réussite global de ${metrics.winRate.toFixed(1)}% indiquent l'absence d'un modèle d'exécution standardisé.`;
  } else {
    consistencyExpl = consistency >= 80
      ? `Excellent performance consistency. Your win rate of ${metrics.winRate.toFixed(1)}% is backed by steady trade numbers and a robust win-to-loss streak ratio of ${streakRatio.toFixed(1)}.`
      : consistency >= 60
      ? `Moderate consistency. Your performance is somewhat scattered. Your win rate fluctuates, and you are susceptible to consecutive loss clusters (${metrics.maxLoseStreak} losses in a row).`
      : `Erratic consistency. High fluctuation in returns and a low overall win rate of ${metrics.winRate.toFixed(1)}% indicate lack of a standardized execution model.`;
  }

  let executionExpl = "";
  if (lang === "ar") {
    executionExpl = execution >= 80
      ? `تنفيذ صفقات من النخبة. نسبة المخاطرة إلى المكافأة 1:${rr.toFixed(1)} ممتازة، مما يمنحك توقعاً إيجابياً بقيمة $${metrics.expectancy.toFixed(2)} لكل صفقة حتى لو انخفضت نسبة الفوز.`
      : execution >= 60
      ? `جودة تنفيذ مقبولة. نسبة المخاطرة إلى المكافأة هي 1:${rr.toFixed(1)}. إن رفعها فوق 1:1.5 سيحسن بشكل كبير من توقعاتك الرياضية.`
      : `تنفيذ أقل من المطلوب. نسبة المخاطرة إلى المكافأة هي 1:${rr.toFixed(1)} فقط، مما يعني أنه يجب عليك الحفاظ على نسبة فوز عالية جداً وغير مستدامة لمجرد التعادل.`;
  } else if (lang === "fr") {
    executionExpl = execution >= 80
      ? `Exécution d'élite. Votre ratio Risque/Rendement de 1:${rr.toFixed(1)} est exceptionnel, vous donnant une espérance positive de $${metrics.expectancy.toFixed(2)} par trade même si le taux de réussite baisse.`
      : execution >= 60
      ? `Qualité d'exécution décente. Votre ratio Risque/Rendement est de 1:${rr.toFixed(1)}. Passer au-dessus de 1:1,5 améliorera considérablement votre espérance mathématique.`
      : `Exécution sous-optimale. Votre ratio Risque/Rendement n'est que de 1:${rr.toFixed(1)}, ce qui signifie que vous devez maintenir un taux de réussite extrêmement élevé et insoutenable pour rester à l'équilibre.`;
  } else {
    executionExpl = execution >= 80
      ? `Elite trade execution. Your Risk/Reward ratio of 1:${rr.toFixed(1)} is outstanding, giving you a positive expectancy of $${metrics.expectancy.toFixed(2)} per trade even if win rate drops.`
      : execution >= 60
      ? `Decent execution quality. Your Risk/Reward ratio is 1:${rr.toFixed(1)}. Moving this above 1:1.5 will dramatically improve your mathematical expectancy.`
      : `Suboptimal execution. Your Risk/Reward ratio is only 1:${rr.toFixed(1)}, meaning you must maintain an extremely high, unsustainable win rate to remain break-even.`;
  }

  let psychologyExpl = "";
  if (lang === "ar") {
    psychologyExpl = psychology >= 80
      ? `انضباط ذهني استثنائي. لا تظهر عليك أي علامات تقريباً للتداول الانتقامي العاطفي، وتترك صفقاتك الرابحة تستمر (الاحتفاظ بالرابحة لمدة ${avgWinDur.toFixed(1)} دقيقة مقابل الخاسرة لمدة ${avgLossDur.toFixed(1)} دقيقة).`
      : psychology >= 60
      ? `نفسية إيجابية، ولكنك عرضة لمحفزات عاطفية معينة. هناك آثار لتجنب الخسارة حيث تحتفظ بالمراكز الخاسرة (${avgLossDur.toFixed(1)} دقيقة) لفترة أطول قليلاً من الرابحة.`
      : `أدلة قوية على التحيزات النفسية. تحتفظ بالصفقات الخاسرة لمدة ${avgLossDur.toFixed(1)} دقيقة (وهو ما يعادل ${(avgLossDur / Math.max(1, avgWinDur)).toFixed(1)} أضعاف الرابحة)، مما يعكس تحيزاً شديداً لتجنب الخسارة. كما تظهر لديك محفزات التداول الانتقامي مباشرة بعد التعرض للخسارة.`;
  } else if (lang === "fr") {
    psychologyExpl = psychology >= 80
      ? `Discipline mentale exceptionnelle. Vous ne montrez pratiquement aucun signe de trading de vengeance émotionnel, et vous laissez courir vos trades gagnants (gagnants conservés pendant ${avgWinDur.toFixed(1)} min contre ${avgLossDur.toFixed(1)} min pour les perdants).`
      : psychology >= 60
      ? `Psychologie favorable, mais vulnérable à des déclencheurs émotionnels spécifiques. Il y a des traces d'aversion à la perte où vous conservez vos positions perdantes (${avgLossDur.toFixed(1)} min) légèrement plus longtemps que vos gains.`
      : `Preuves solides de biais psychologiques. Vous conservez les perdants pendant ${avgLossDur.toFixed(1)} minutes (soit ${(avgLossDur / Math.max(1, avgWinDur)).toFixed(1)}x plus longtemps que les gagnants), reflétant un grave biais d'aversion à la perte. Vous manifestez également du trading de vengeance juste après une perte.`;
  } else {
    psychologyExpl = psychology >= 80
      ? `Exceptional mental discipline. You show virtually zero signs of emotional revenge trading, and you let your winning trades run (holding winners for ${avgWinDur.toFixed(1)} mins vs losers for ${avgLossDur.toFixed(1)} mins).`
      : psychology >= 60
      ? `Favorable psychology, but vulnerable to specific emotional triggers. There are traces of loss aversion where you hold losing positions (${avgLossDur.toFixed(1)} mins) slightly longer than winners.`
      : `Strong evidence of psychological biases. You hold losing trades for ${avgLossDur.toFixed(1)} minutes (which is ${(avgLossDur / Math.max(1, avgWinDur)).toFixed(1)}x longer than winners), reflecting severe 'loss-aversion' bias. You also exhibit revenge trading triggers right after taking a loss.`;
  }

  let disciplineExpl = "";
  if (lang === "ar") {
    disciplineExpl = discipline >= 80
      ? `منضبط للغاية. استقرار ممتاز في تحديد حجم الصفقات. متوسط حجم العقد لديك هو ${avgLot.toFixed(2)} وحجمك الأقصى يظل متناسباً تماماً.`
      : discipline >= 60
      ? `انضباط مرضٍ. ومع ذلك، هناك حالات تداولت فيها بأحجام عقود غير منتظمة (أقصى حجم عقد ${maxLot.toFixed(2)} مقابل المتوسط ${avgLot.toFixed(2)}). تجنب الدخول بعقود ضخمة مفاجئة.`
      : `انضباط تداول ضعيف وغير كافٍ. الحد الأقصى لحجم العقد لديك وهو ${maxLot.toFixed(2)} أكبر بمقدار ${largestLossToAvgRatio.toFixed(1)} ضعفاً من متوسط حجمك البالغ ${avgLot.toFixed(2)}. يمثل هذا استخداماً عشوائياً للرافعة المالية ومطاردة للأحجام.`;
  } else if (lang === "fr") {
    disciplineExpl = discipline >= 80
      ? `Très discipliné. Excellente stabilité de la taille des positions. Votre taille de lot moyenne est de ${avgLot.toFixed(2)} et votre taille maximale reste parfaitement proportionnelle.`
      : discipline >= 60
      ? `Discipline satisfaisante. Cependant, il y a des cas où vous avez négocié avec des tailles de lots irrégulières (taille de lot max ${maxLot.toFixed(2)} vs moyenne ${avgLot.toFixed(2)}). Évitez de gonfler démesurément vos lots.`
      : `Discipline de trading insuffisante. Votre taille de lot maximale de ${maxLot.toFixed(2)} est ${largestLossToAvgRatio.toFixed(1)}x plus élevée que votre taille moyenne de ${avgLot.toFixed(2)}. Cela représente une utilisation erratique du levier.`;
  } else {
    disciplineExpl = discipline >= 80
      ? `Highly disciplined. Excellent position sizing stability. Your average lot size is ${avgLot.toFixed(2)} and your maximum size is kept perfectly proportional.`
      : discipline >= 60
      ? `Satisfactory discipline. However, there are instances where you traded with irregular lot sizes (max lot size ${maxLot.toFixed(2)} vs average ${avgLot.toFixed(2)}). Avoid 'size-bombing'.`
      : `Deficient trading discipline. Your maximum lot size of ${maxLot.toFixed(2)} is ${largestLossToAvgRatio.toFixed(1)}x higher than your average size of ${avgLot.toFixed(2)}. This represents erratic leverage usage and size-chasing.`;
  }

  const explanations = {
    overall: overallExpl,
    riskManagement: riskExpl,
    consistency: consistencyExpl,
    execution: executionExpl,
    psychology: psychologyExpl,
    discipline: disciplineExpl
  };

  return { overall, subScores: { riskManagement, consistency, execution, psychology, discipline }, explanations };
}

/* ─────────────────────────────────────────────────────────
   2. EVOLUTION TRACKING ENGINE
   ───────────────────────────────────────────────────────── */
export function calculateEvolutionTracking(trades: Trade[], lang: string = "en"): EvolutionTrackingResult {
  if (!trades || trades.length === 0) {
    return { byMonth: [], byWeek: [], trends: { winRate: { direction: "flat", percentChange: 0, text: "" }, profit: { direction: "flat", percentChange: 0, text: "" }, drawdown: { direction: "flat", percentChange: 0, text: "" }, expectancy: { direction: "flat", percentChange: 0, text: "" }, profitFactor: { direction: "flat", percentChange: 0, text: "" } }, insights: [] };
  }

  // Sort trades by date
  const sorted = [...trades].sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime());

  // Helper to calculate metrics for a subset of trades
  const computeGroupMetrics = (groupTrades: Trade[], label: string): EvolutionPeriod => {
    const total = groupTrades.length;
    const wins = groupTrades.filter(t => t.netProfit > 0);
    const losses = groupTrades.filter(t => t.netProfit < 0);
    const winRate = total > 0 ? (wins.length / total) * 100 : 0;
    const profit = groupTrades.reduce((sum, t) => sum + t.netProfit, 0);
    
    const grossProfit = wins.reduce((sum, t) => sum + t.netProfit, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.netProfit, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 5 : 1;

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const riskReward = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 2 : 1;
    const expectancy = total > 0 ? profit / total : 0;

    // Local drawdown calculation on this slice
    let maxDd = 0;
    let balance = 10000; // arbitrary start
    let peak = balance;
    for (const t of groupTrades) {
      balance += t.netProfit;
      if (balance > peak) peak = balance;
      const dd = peak - balance;
      if (dd > maxDd) maxDd = dd;
    }

    return {
      periodLabel: label,
      tradesCount: total,
      winRate,
      drawdown: maxDd,
      profit,
      expectancy,
      profitFactor,
      averageWin: avgWin,
      averageLoss: avgLoss,
      riskReward
    };
  };

  // Group by Month (Year-Month)
  const monthlyMap = new Map<string, Trade[]>();
  // Group by ISO Week (Year-Week)
  const weeklyMap = new Map<string, Trade[]>();

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (const t of sorted) {
    const mKey = `${t.closeTime.getFullYear()}-${String(t.closeTime.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap.has(mKey)) monthlyMap.set(mKey, []);
    monthlyMap.get(mKey)!.push(t);

    const wNum = getWeekNumber(t.closeTime);
    const wKey = `${t.closeTime.getFullYear()}-W${String(wNum).padStart(2, "0")}`;
    if (!weeklyMap.has(wKey)) weeklyMap.set(wKey, []);
    weeklyMap.get(wKey)!.push(t);
  }

  const byMonth = Array.from(monthlyMap.entries()).map(([key, group]) => {
    const [yr, mo] = key.split("-");
    const name = `${MONTH_NAMES[parseInt(mo) - 1]} ${yr}`;
    return computeGroupMetrics(group, name);
  });

  const byWeek = Array.from(weeklyMap.entries()).map(([key, group]) => {
    const [, wk] = key.split("-");
    const name = `Week ${wk}`;
    return computeGroupMetrics(group, name);
  });

  const periods = byMonth.length >= 2 ? byMonth : byWeek;
  const hasMultiple = periods.length >= 2;

  const getTrend = (field: keyof EvolutionPeriod, lowIsBetter = false) => {
    if (!hasMultiple) {
      const insfText = lang === "ar" ? "تاريخ غير كافٍ" : lang === "fr" ? "Historique insuffisant" : "Insufficient history";
      return { direction: "flat" as const, percentChange: 0, text: insfText };
    }
    const last = periods[periods.length - 1][field] as number;
    const prev = periods[periods.length - 2][field] as number;

    if (prev === 0) {
      const impText = lang === "ar" ? "تحسن" : lang === "fr" ? "Amélioré" : "Improved";
      const conText = lang === "ar" ? "مستمر" : lang === "fr" ? "Constant" : "Consistent";
      return { direction: last > 0 ? "up" as const : "flat" as const, percentChange: 0, text: last > 0 ? impText : conText };
    }

    const diff = last - prev;
    const pct = (diff / Math.abs(prev)) * 100;

    let dir: "up" | "down" | "flat" = "flat";
    if (Math.abs(pct) < 1) dir = "flat";
    else if (pct > 0) dir = "up";
    else dir = "down";

    const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
    
    let directionWord = "";
    let vsPriorText = "";
    if (lang === "ar") {
      directionWord = dir === "flat" ? "مستقر" : dir === "up" ? "زيادة" : "انخفاض";
      vsPriorText = "مقارنة بالفترة السابقة";
    } else if (lang === "fr") {
      directionWord = dir === "flat" ? "stable" : dir === "up" ? "hausse" : "baisse";
      vsPriorText = "par rapport à la période précédente";
    } else {
      directionWord = dir === "flat" ? "flat" : dir === "up" ? "increase" : "decrease";
      vsPriorText = "vs prior period";
    }

    const text = `${arrow} ${Math.abs(pct).toFixed(1)}% ${directionWord} ${vsPriorText}`;

    return { direction: dir, percentChange: pct, text };
  };

  const trends = {
    winRate: getTrend("winRate"),
    profit: getTrend("profit"),
    drawdown: getTrend("drawdown", true),
    expectancy: getTrend("expectancy"),
    profitFactor: getTrend("profitFactor")
  };

  const insights: string[] = [];
  if (hasMultiple) {
    const lastP = periods[periods.length - 1];
    const prevP = periods[periods.length - 2];

    if (lastP.profit > prevP.profit && lastP.profit > 0) {
      const improvePct = prevP.profit > 0 ? ((lastP.profit - prevP.profit) / prevP.profit * 100).toFixed(0) : "100+";
      if (lang === "ar") {
        insights.push(`تحسن أداؤك المالي لشهر/أسبوع ${lastP.periodLabel} بنسبة ${improvePct}% مقارنة بـ ${prevP.periodLabel}، مدفوعاً بتنفيذ أقوى.`);
      } else if (lang === "fr") {
        insights.push(`Votre performance financière de ${lastP.periodLabel} s'est améliorée de ${improvePct}% par rapport à ${prevP.periodLabel}, grâce à une meilleure exécution.`);
      } else {
        insights.push(`Your ${lastP.periodLabel} financial performance improved by ${improvePct}% compared to ${prevP.periodLabel}, driven by stronger execution.`);
      }
    } else if (lastP.profit < prevP.profit) {
      if (lang === "ar") {
        insights.push(`انخفض صافي عوائدك في ${lastP.periodLabel}. يرجى مراجعة التعرض الأخير للمخاطر أو الإرهاق العاطفي.`);
      } else if (lang === "fr") {
        insights.push(`Vos rendements nets ont chuté en ${lastP.periodLabel}. Examinez vos récentes expositions au risque ou votre fatigue émotionnelle.`);
      } else {
        insights.push(`Your net returns dropped in ${lastP.periodLabel}. Review recent risk exposures or emotional fatigue.`);
      }
    }

    if (lastP.winRate > prevP.winRate + 5) {
      if (lang === "ar") {
        insights.push(`ارتفعت نسبة الفوز بمقدار ${(lastP.winRate - prevP.winRate).toFixed(1)}% في ${lastP.periodLabel}. دقة الدخول تبلغ ذروتها حالياً.`);
      } else if (lang === "fr") {
        insights.push(`Le taux de réussite a bondi de ${(lastP.winRate - prevP.winRate).toFixed(1)}% en ${lastP.periodLabel}. La précision est actuellement à son maximum.`);
      } else {
        insights.push(`Win rate jumped by ${(lastP.winRate - prevP.winRate).toFixed(1)}% in ${lastP.periodLabel}. Accuracy is currently peaking.`);
      }
    }

    if (lastP.riskReward > prevP.riskReward + 0.2) {
      if (lang === "ar") {
        insights.push(`توسعت نسبة المخاطرة/المكافأة من 1:${prevP.riskReward.toFixed(1)} إلى 1:${lastP.riskReward.toFixed(1)} في ${lastP.periodLabel}. أنت تترك صفقاتك الرابحة تستمر بشكل أفضل بكثير.`);
      } else if (lang === "fr") {
        insights.push(`Votre ratio Risque/Rendement est passé de 1:${prevP.riskReward.toFixed(1)} à 1:${lastP.riskReward.toFixed(1)} en ${lastP.periodLabel}. Vous laissez beaucoup mieux courir vos gains.`);
      } else {
        insights.push(`Your Risk/Reward multiplier expanded from 1:${prevP.riskReward.toFixed(1)} to 1:${lastP.riskReward.toFixed(1)} in ${lastP.periodLabel}. You are letting winners run much better.`);
      }
    }

    if (lastP.drawdown < prevP.drawdown * 0.7 && lastP.drawdown > 0) {
      if (lang === "ar") {
        insights.push(`تخفيف استثنائي للتراجع. انخفض تذبذب منحنى رأس المال بنسبة تزيد عن 30% في ${lastP.periodLabel}.`);
      } else if (lang === "fr") {
        insights.push(`Atténuation exceptionnelle du drawdown. La volatilité de votre courbe d'équité a chuté de plus de 30% en ${lastP.periodLabel}.`);
      } else {
        insights.push(`Exceptional drawdowns mitigation. Volatility in your equity curve dropped by over 30% in ${lastP.periodLabel}.`);
      }
    }
  } else {
    if (lang === "ar") {
      insights.push("قم برفع المزيد من تاريخ التداول عبر الأسابيع/الأشهر لتفعيل التتبع الديناميكي للفترة تلو الأخرى.");
    } else if (lang === "fr") {
      insights.push("Importez plus d'historique sur plusieurs semaines/mois pour activer le suivi dynamique d'une période à l'autre.");
    } else {
      insights.push("Upload more trading history across weeks/months to activate dynamic period-over-period tracking.");
    }
  }

  return { byMonth, byWeek, trends, insights };
}

/* ─────────────────────────────────────────────────────────
   3. GOAL SYSTEM ENGINE
   ───────────────────────────────────────────────────────── */
export function calculateGoalProgress(trades: Trade[], metrics: PerformanceMetrics, lang: string = "en"): TradingGoal[] {
  // Calculate day-based metrics first so we can use them in initializers if needed
  const tradesByDay = new Map<string, number>();
  let fridayCount = 0;
  for (const t of trades) {
    const day = t.openTime.getUTCDay();
    if (day === 5) fridayCount++; // Friday
    
    const dateStr = t.openTime.toDateString();
    tradesByDay.set(dateStr, (tradesByDay.get(dateStr) || 0) + 1);
  }

  const daysList = Array.from(tradesByDay.values());
  const maxTradesInADay = daysList.length > 0 ? Math.max(...daysList) : 0;

  let g1Title = "Keep Maximum Drawdown Low";
  let g1Evidence = `Your actual maximum drawdown is ${metrics.maxDrawdownPercent.toFixed(2)}%.`;
  let g1Label = "% Drawdown";

  let g2Title = "Maintain Target Win Rate";
  let g2Evidence = `Your current win rate across ${metrics.totalTrades} trades is ${metrics.winRate.toFixed(1)}%.`;
  let g2Label = "% Win Rate";

  let g3Title = "Keep Profit Factor > 1.5";
  let g3Evidence = `Gross Profit of $${metrics.grossProfit.toFixed(1)} vs Gross Loss of $${metrics.grossLoss.toFixed(1)} yields a PF of ${metrics.profitFactor.toFixed(2)}.`;
  let g3Label = "Factor";

  let g4Title = "Limit Over-trading";
  let g4Label = "Trades/Day";
  let g4Evidence = "";

  let g5Title = "No Friday Trading Rule";
  let g5Label = "Friday Trades";
  let g5Evidence = "";

  if (lang === "ar") {
    g1Title = "الحفاظ على انخفاض الحد الأقصى للتراجع";
    g1Evidence = `الحد الأقصى الفعلي للتراجع الخاص بك هو ${metrics.maxDrawdownPercent.toFixed(2)}%.`;
    g1Label = "التراجع %";

    g2Title = "الحفاظ على نسبة الفوز المستهدفة";
    g2Evidence = `نسبة فوزك الحالية عبر ${metrics.totalTrades} صفقة هي ${metrics.winRate.toFixed(1)}%.`;
    g2Label = "نسبة الفوز %";

    g3Title = "إبقاء عامل الربح أكبر من 1.5";
    g3Evidence = `إجمالي الأرباح البالغ $${metrics.grossProfit.toFixed(1)} مقابل إجمالي الخسائر البالغ $${metrics.grossLoss.toFixed(1)} ينتج عنه عامل ربح قدره ${metrics.profitFactor.toFixed(2)}.`;
    g3Label = "المعامل";

    g4Title = "الحد من الإفراط في التداول";
    g4Label = "صفقات/يوم";
    g4Evidence = maxTradesInADay > 5 
      ? `فشل. تضمن يومك الأكثر نشاطاً ${maxTradesInADay} صفقة، متجاوزاً الحد الأقصى البالغ 5 صفقات.`
      : `نجاح. تم إبقاء الحد الأقصى لحجم التداول في يوم واحد عند ${maxTradesInADay} صفقة.`;

    g5Title = "قاعدة عدم التداول يوم الجمعة";
    g5Label = "صفقات الجمعة";
    g5Evidence = fridayCount > 0 
      ? `لقد قمت بفتح ${fridayCount} صفقات يوم الجمعة. تاريخياً، تتسم أيام الجمعة بتقلبات شديدة واحتمالات ربح أقل لإعدادات صفقاتك.`
      : `ممتاز. لقد تجنبت تماماً فتح أي صفقات في أيام الجمعة.`;
  } else if (lang === "fr") {
    g1Title = "Maintenir un drawdown maximum faible";
    g1Evidence = `Votre drawdown maximum réel est de ${metrics.maxDrawdownPercent.toFixed(2)}%.`;
    g1Label = "% Drawdown";

    g2Title = "Maintenir le taux de réussite cible";
    g2Evidence = `Votre taux de réussite actuel sur ${metrics.totalTrades} trades est de ${metrics.winRate.toFixed(1)}%.`;
    g2Label = "% de réussite";

    g3Title = "Maintenir le facteur de profit > 1.5";
    g3Evidence = `Le gain brut de $${metrics.grossProfit.toFixed(1)} contre une perte brute de $${metrics.grossLoss.toFixed(1)} génère un facteur de profit de ${metrics.profitFactor.toFixed(2)}.`;
    g3Label = "Facteur";

    g4Title = "Limiter le sur-trading";
    g4Label = "Trades/Jour";
    g4Evidence = maxTradesInADay > 5 
      ? `Échec. Votre journée la plus active a compté ${maxTradesInADay} trades, dépassant votre limite de 5.`
      : `Réussi. Votre volume de trading maximal en une seule journée a été limité à ${maxTradesInADay} positions.`;

    g5Title = "Régrule de non-trading le vendredi";
    g5Label = "Trades du Vendredi";
    g5Evidence = fridayCount > 0 
      ? `Vous avez exécuté ${fridayCount} trades les vendredis. Les vendredis sont historiquement très volatils et présentent une probabilité plus faible pour votre configuration.`
      : `Excellent. Vous avez strictement évité d'ouvrir des trades les vendredis.`;
  } else {
    g4Evidence = maxTradesInADay > 5 
      ? `Failed. Your busiest trading day had ${maxTradesInADay} trades, exceeding your limit of 5.`
      : `Passed. Your maximum trading volume in a single day was kept to ${maxTradesInADay} positions.`;

    g5Evidence = fridayCount > 0 
      ? `You executed ${fridayCount} trades on Fridays. Fridays are historically highly volatile and lower-probability for your setup.`
      : `Excellent. You strictly avoided opening trades on Fridays.`;
  }

  const defaultGoals: TradingGoal[] = [
    {
      id: "g1",
      type: "max_drawdown",
      title: g1Title,
      targetValue: 8.0,
      currentValue: metrics.maxDrawdownPercent,
      evidence: g1Evidence,
      status: metrics.maxDrawdownPercent <= 8.0 ? "passed" : "failed",
      metricLabel: g1Label
    },
    {
      id: "g2",
      type: "min_win_rate",
      title: g2Title,
      targetValue: 45.0,
      currentValue: metrics.winRate,
      evidence: g2Evidence,
      status: metrics.winRate >= 45.0 ? "passed" : "failed",
      metricLabel: g2Label
    },
    {
      id: "g3",
      type: "min_profit_factor",
      title: g3Title,
      targetValue: 1.5,
      currentValue: metrics.profitFactor,
      evidence: g3Evidence,
      status: metrics.profitFactor >= 1.5 ? "passed" : "failed",
      metricLabel: g3Label
    },
    {
      id: "g4",
      type: "max_trades_per_day",
      title: g4Title,
      targetValue: 5,
      currentValue: maxTradesInADay,
      evidence: g4Evidence,
      status: maxTradesInADay <= 5 ? "passed" : "failed",
      metricLabel: g4Label
    },
    {
      id: "g5",
      type: "no_friday_trading",
      title: g5Title,
      targetValue: 0,
      currentValue: fridayCount,
      evidence: g5Evidence,
      status: fridayCount === 0 ? "passed" : "failed",
      metricLabel: g5Label
    }
  ];

  return defaultGoals;
}

/* ─────────────────────────────────────────────────────────
   4. SMART MISTAKE DETECTION
   ───────────────────────────────────────────────────────── */
export function detectSmartMistakes(trades: Trade[], metrics: PerformanceMetrics, lang: string = "en"): SmartMistake[] {
  if (!trades || trades.length === 0) return [];

  const mistakes: SmartMistake[] = [];

  // A. Revenge Trading
  let revengeTrades = 0;
  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1];
    const curr = trades[i];
    if (prev.netProfit < 0) {
      const gapMinutes = (curr.openTime.getTime() - prev.closeTime.getTime()) / 60000;
      if (gapMinutes > 0 && gapMinutes <= 15) {
        revengeTrades++;
      }
    }
  }
  const revengeFreq = (revengeTrades / trades.length) * 100;
  if (revengeTrades > 0) {
    let type = "Revenge Trading";
    let title = "Emotional Revenge Trading";
    let desc = "Opening positions within 15 minutes of taking a loss, indicating a psychological drive to 'win back' money rather than execute a calculated setup.";
    let evidence = `Detected ${revengeTrades} revenge-entry occurrences. Taking rapid back-to-back positions following losses accounted for ${revengeFreq.toFixed(1)}% of your entries.`;
    let suggestedFix = "Implement a hard 1-hour lockout rule. After any losing trade, close your trading terminal and walk away for at least 60 minutes to neutralize cortisol and emotional bias.";

    if (lang === "ar") {
      type = "التداول الانتقامي";
      title = "التداول الانتقامي العاطفي";
      desc = "فتح مراكز جديدة في غضون 15 دقيقة من التعرض للخسارة، مما يشير إلى دافع نفسي لـ 'استعادة' الأموال بدلاً من تنفيذ صفقة مدروسة بعناية.";
      evidence = `تم اكتشاف ${revengeTrades} حالة دخول انتقامي عاطفي. ويمثل اتخاذ مراكز سريعة ومتتالية بعد الخسائر بنسبة ${revengeFreq.toFixed(1)}% من صفقاتك.`;
      suggestedFix = "قم بتطبيق قاعدة إغلاق صارمة لمدة ساعة كاملة. بعد أي صفقة خاسرة، أغلق منصة التداول وابتعد عن الشاشة لمدة 60 دقيقة على الأقل لتحييد هرمون الكورتيزول والتحيز العاطفي.";
    } else if (lang === "fr") {
      type = "Trading de revanche";
      title = "Trading de revanche émotionnel";
      desc = "Ouvrir des positions dans les 15 minutes suivant une perte, indiquant une pulsion psychologique de 'se refaire' plutôt que d'exécuter un plan calculé.";
      evidence = `Détection de ${revengeTrades} cas d'entrée de revanche. Les prises de position rapides successives après des pertes ont représenté ${revengeFreq.toFixed(1)}% de vos entrées.`;
      suggestedFix = "Appliquez une règle stricte de verrouillage d'une heure. Après toute perte, fermez votre plateforme et éloignez-vous des écrans pendant au moins 60 minutes pour dissiper le stress et les biais émotionnels.";
    }

    mistakes.push({
      id: "mistake_revenge",
      type,
      title,
      description: desc,
      severity: revengeFreq > 15 ? "high" : revengeFreq > 5 ? "medium" : "low",
      frequency: revengeFreq,
      evidence,
      suggestedFix
    });
  }

  // B. Over Trading
  const tradesByDay = new Map<string, number>();
  for (const t of trades) {
    const dStr = t.openTime.toDateString();
    tradesByDay.set(dStr, (tradesByDay.get(dStr) || 0) + 1);
  }
  const overTradingDays = Array.from(tradesByDay.values()).filter(count => count > 6).length;
  const totalDays = tradesByDay.size;
  const overtradingFreq = totalDays > 0 ? (overTradingDays / totalDays) * 100 : 0;
  if (overTradingDays > 0) {
    let type = "Over Trading";
    let title = "Excessive Over-Trading";
    let desc = "Opening too many positions in a single day, which degrades performance due to fatigue, commission accumulation, and dilution of high-probability setups.";
    let evidence = `You traded excessively on ${overTradingDays} days (over 6 positions per day), representing ${overtradingFreq.toFixed(0)}% of your active days.`;
    let suggestedFix = "Establish a hard cap of 3 trades per day. Once you reach 3 trades (whether win or loss), your day is strictly finished. This forces high selectivity.";

    if (lang === "ar") {
      type = "الإفراط في التداول";
      title = "الإفراط الشديد في التداول";
      desc = "فتح عدد كبير جداً من الصفقات في يوم واحد، مما يضر بالأداء العام نتيجة الإرهاق وتراكم العمولات وتشتيت الانتباه عن الصفقات ذات الاحتمالية العالية.";
      evidence = `لقد تداولت بشكل مفرط في ${overTradingDays} أيام (أكثر من 6 صفقات في اليوم)، وهو ما يمثل ${overtradingFreq.toFixed(0)}% من أيام تداولك النشطة.`;
      suggestedFix = "ضع حداً أقصى صارماً لا يتجاوز 3 صفقات يومياً. بمجرد الوصول إلى 3 صفقات (سواء كانت رابحة أم خاسرة)، ينتهي يوم التداول الخاص بك تماماً. هذا يجبرك على الانتقاء الشديد لصفقاتك.";
    } else if (lang === "fr") {
      type = "Sur-trading";
      title = "Sur-trading excessif";
      desc = "Ouvrir trop de positions en une seule journée, ce qui dégrade la performance globale à cause de la fatigue, de l'accumulation de commissions et de la dilution des configurations à haute probabilité.";
      evidence = `Vous avez négocié de manière excessive pendant ${overTradingDays} jours (plus de 6 positions par jour), représentant ${overtradingFreq.toFixed(0)}% de vos jours actifs.`;
      suggestedFix = "Fixez une limite stricte de 3 trades par jour maximum. Une fois les 3 trades atteints (gagnants ou perdants), votre journée est terminée. Cela impose une grande sélectivité.";
    }

    mistakes.push({
      id: "mistake_overtrading",
      type,
      title,
      description: desc,
      severity: overtradingFreq > 25 ? "high" : overtradingFreq > 10 ? "medium" : "low",
      frequency: overtradingFreq,
      evidence,
      suggestedFix
    });
  }

  // C. Martingale / Increasing Lot After Loss
  let martingaleOccurrences = 0;
  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1];
    const curr = trades[i];
    if (prev.netProfit < 0 && curr.volume > prev.volume * 1.2) {
      martingaleOccurrences++;
    }
  }
  const martingaleFreq = (martingaleOccurrences / trades.length) * 100;
  if (martingaleOccurrences > 0) {
    let type = "Increasing Lot size after Loss";
    let title = "Martingale Leverage Escalation";
    let desc = "Increasing position sizing immediately after a loss to recover losses quicker. This is the fastest way to blow a trading account.";
    let evidence = `Detected ${martingaleOccurrences} positions with elevated lot sizes opened directly after a losing trade, affecting ${martingaleFreq.toFixed(1)}% of trades.`;
    let suggestedFix = "Use an automated risk calculator or fixed lot size spreadsheet. Never manually adjust risk upward after a loss. Your risk must stay constant (e.g. 1%) or scale down during a drawdown.";

    if (lang === "ar") {
      type = "زيادة حجم العقد بعد الخسارة";
      title = "تصعيد الرافعة المالية (مارتينجال)";
      desc = "زيادة حجم الصفقة مباشرة بعد الخسارة لمحاولة تعويض الخسائر بشكل أسرع. هذه هي أسرع طريقة لتدمير حساب التداول بالكامل.";
      evidence = `تم اكتشاف ${martingaleOccurrences} صفقة بأحجام عقود مرتفعة تم فتحها مباشرة بعد صفقة خاسرة، مما أثر على ${martingaleFreq.toFixed(1)}% من صفقاتك.`;
      suggestedFix = "استخدم حاسبة مخاطر تلقائية أو جدولاً ثابتاً لحجم العقود. لا تقم أبداً بتعديل المخاطر يدوياً صعوداً بعد الخسارة. يجب أن تظل مخاطرتك ثابتة (مثلاً 1%) أو تقل أثناء التراجع.";
    } else if (lang === "fr") {
      type = "Augmentation de la taille après une perte";
      title = "Escalade de levier (Martingale)";
      desc = "Augmenter la taille de la position immédiatement après une perte pour récupérer plus rapidement. C'est le moyen le plus rapide de détruire un compte.";
      evidence = `Détection de ${martingaleOccurrences} positions avec des tailles de lots augmentées ouvertes juste après un trade perdant, affectant ${martingaleFreq.toFixed(1)}% des trades.`;
      suggestedFix = "Utilisez un calculateur de risque automatisé. N'ajustez jamais manuellement le risque à la hausse après une perte. Votre risque doit rester constant (ex. 1%) ou diminuer en période de drawdown.";
    }

    mistakes.push({
      id: "mistake_martingale",
      type,
      title,
      description: desc,
      severity: martingaleFreq > 10 ? "high" : martingaleFreq > 3 ? "medium" : "low",
      frequency: martingaleFreq,
      evidence,
      suggestedFix
    });
  }

  // D. Holding Losers Too Long
  const winners = trades.filter(t => t.netProfit > 0);
  const losers = trades.filter(t => t.netProfit < 0);
  const avgWinDuration = winners.length > 0 ? winners.reduce((sum, t) => sum + t.durationMinutes, 0) / winners.length : 1;
  const avgLossDuration = losers.length > 0 ? losers.reduce((sum, t) => sum + t.durationMinutes, 0) / losers.length : 1;

  if (avgLossDuration > avgWinDuration * 1.8) {
    const lossToWinRatio = avgLossDuration / avgWinDuration;
    let type = "Holding Losers Too Long";
    let title = "Loss-Aversion Holding Bias";
    let desc = "Holding onto losing positions waiting for them to break even, while closing winners quickly. This creates a terrible average Risk/Reward ratio.";
    let evidence = `Your average losing trade is held for ${avgLossDuration.toFixed(1)} minutes, which is ${lossToWinRatio.toFixed(1)}x longer than your average winner (${avgWinDuration.toFixed(1)} mins).`;
    let suggestedFix = "Define a strict time-based stop or price-based hard stop. Set stop-losses *before* entering, and NEVER move a stop-loss further away under any circumstance.";

    if (lang === "ar") {
      type = "الاحتفاظ بالخاسرين لفترة طويلة";
      title = "تحيز تجنب الخسارة";
      desc = "التمسك بالصفقات الخاسرة على أمل وصولها إلى نقطة التعادل، مع إغلاق الصفقات الرابحة بسرعة. هذا يخلق نسبة مخاطرة إلى مكافأة سيئة للغاية في المتوسط.";
      evidence = `يتم الاحتفاظ بمتوسط صفقاتك الخاسرة لمدة ${avgLossDuration.toFixed(1)} دقيقة، وهو ما يعادل ${lossToWinRatio.toFixed(1)} أضعاف مدة الصفقات الرابحة (${avgWinDuration.toFixed(1)} دقيقة).`;
      suggestedFix = "حدد وقف خسارة زمني أو وقف خسارة سعري صارم. ضع أوامر وقف الخسارة *قبل* الدخول في أي صفقة، ولا تقم أبداً بتحريك أمر وقف الخسارة بعيداً تحت أي ظرف.";
    } else if (lang === "fr") {
      type = "Conserver les perdants trop longtemps";
      title = "Biais d'aversion à la perte";
      desc = "Conserver les positions perdantes en attendant qu'elles reviennent à l'équilibre, tout en coupant les gains trop vite. Cela détruit le ratio Risque/Rendement moyen.";
      evidence = `Vos trades perdants sont conservés en moyenne pendant ${avgLossDuration.toFixed(1)} minutes, soit ${lossToWinRatio.toFixed(1)}x plus longtemps que vos gains (${avgWinDuration.toFixed(1)} min).`;
      suggestedFix = "Définissez un stop temporel strict ou un stop physique basé sur le prix. Placez vos stop-loss *avant* d'entrer en position, et ne les déplacez JAMAIS pour les élargir.";
    }

    mistakes.push({
      id: "mistake_holding_losers",
      type,
      title,
      description: desc,
      severity: lossToWinRatio > 3.0 ? "high" : "medium",
      frequency: (losers.length / trades.length) * 100,
      evidence,
      suggestedFix
    });
  }

  // E. Closing Winners Too Early (Micro-Management)
  const quickWinners = winners.filter(t => t.durationMinutes < Math.min(5, avgWinDuration * 0.3));
  const microWinsFreq = (quickWinners.length / Math.max(1, winners.length)) * 100;
  if (microWinsFreq > 30 && winners.length >= 5) {
    let type = "Closing Winners Too Early";
    let title = "Micro-Managed Early Exits";
    let desc = "Closing profitable trades prematurely due to fear of giving back profit, preventing your edge from hitting the full target.";
    let evidence = `You closed ${quickWinners.length} winning trades within 5 minutes of opening, representing ${microWinsFreq.toFixed(1)}% of your winning trades.`;
    let suggestedFix = "Apply the 'hands-off' execution strategy. Once a trade is active with set SL and TP, do not touch it unless there is a fundamental structure break. Let the market play out.";

    if (lang === "ar") {
      type = "إغلاق الصفقات الرابحة مبكراً";
      title = "الخروج المبكر بسبب الإدارة الدقيقة الزائدة";
      desc = "إغلاق الصفقات المربحة قبل الأوان بسبب الخوف من خسارة الأرباح المحققة، مما يمنع صفقتك من بلوغ هدفها الكامل واستراتيجيتك من تحقيق فعاليتها.";
      evidence = `لقد قمت بإغلاق ${quickWinners.length} صفقة رابحة في غضون 5 دقائق من فتحها، وهو ما يمثل ${microWinsFreq.toFixed(1)}% من صفقاتك الرابحة.`;
      suggestedFix = "طبق استراتيجية التنفيذ 'دون تدخل'. بمجرد تفعيل الصفقة مع تحديد أمر وقف الخسارة وجني الأرباح، لا تلمسها إلا إذا كان هناك كسر واضح في الهيكل الفني الأساسي. دع السوق يأخذ مجراه.";
    } else if (lang === "fr") {
      type = "Couper les gains trop tôt";
      title = "Sorties prématurées micro-gérées";
      desc = "Clôturer les trades gagnants prématurément par peur de perdre les gains latents, empêchant votre avantage statistique de s'exprimer pleinement.";
      evidence = `Vous avez clôturé ${quickWinners.length} trades gagnants dans les 5 minutes suivant leur ouverture, soit ${microWinsFreq.toFixed(1)}% de vos gains.`;
      suggestedFix = "Appliquez la stratégie d'exécution sans intervention. Une fois le trade actif avec SL et TP, n'y touchez plus à moins d'une cassure technique majeure. Laissez faire le marché.";
    }

    mistakes.push({
      id: "mistake_early_exit",
      type,
      title,
      description: desc,
      severity: "medium",
      frequency: microWinsFreq,
      evidence,
      suggestedFix
    });
  }

  // F. Low Liquidity Off-Hours Trading
  let offHoursTrades = 0;
  for (const t of trades) {
    const hour = t.openTime.getUTCHours();
    if (hour >= 21 || hour < 1) { // Low liquidity dead zone
      offHoursTrades++;
    }
  }
  const offHoursFreq = (offHoursTrades / trades.length) * 100;
  if (offHoursTrades > 0) {
    let type = "Low Liquidity Trading";
    let title = "Illiquid Zone Trading";
    let desc = "Trading during high-spread, low-volume rollover hours (21:00 to 01:00 UTC) where spreads widen and manipulation is common.";
    let evidence = `You opened ${offHoursTrades} positions during low-liquidity hours (${offHoursFreq.toFixed(1)}% of your total volume).`;
    let suggestedFix = "Restrict execution entirely to the New York (13:00-21:00 UTC) and London (07:00-15:00 UTC) sessions. Avoid trading around rollover completely.";

    if (lang === "ar") {
      type = "التداول في أوقات السيولة المنخفضة";
      title = "التداول في المناطق غير السائلة";
      desc = "التداول خلال ساعات تمديد العقود (من 21:00 إلى 01:00 بتوقيت UTC) حيث يتسع الفارق بين سعر البيع والشراء (Spread) وتقل أحجام التداول وتكثر التلاعبات السعرية.";
      evidence = `لقد قمت بفتح ${offHoursTrades} مركزاً خلال ساعات السيولة المنخفضة (تمثل ${offHoursFreq.toFixed(1)}% من إجمالي حجم صفقاتك).`;
      suggestedFix = "اقتصر في تنفيذ صفقاتك تماماً على جلستي نيويورك (13:00-21:00 بتوقيت UTC) ولندن (07:00-15:00 بتوقيت UTC). وتجنب التداول تماماً في أوقات تمديد العقود.";
    } else if (lang === "fr") {
      type = "Trading en période de faible liquidité";
      title = "Trading en zone illiquide";
      desc = "Trader pendant les heures de rollover (21:00 à 01:00 UTC) caractérisées par des spreads élevés et de faibles volumes, propices aux manipulations.";
      evidence = `Vous avez ouvert ${offHoursTrades} positions pendant les heures de faible liquidité (soit ${offHoursFreq.toFixed(1)}% de votre volume total).`;
      suggestedFix = "Limitez strictement votre exécution aux sessions de New York (13:00-21:00 UTC) et Londres (07:00-15:00 UTC). Évitez complètement la période de rollover.";
    }

    mistakes.push({
      id: "mistake_offhours",
      type,
      title,
      description: desc,
      severity: offHoursFreq > 15 ? "medium" : "low",
      frequency: offHoursFreq,
      evidence,
      suggestedFix
    });
  }

  return mistakes;
}

/* ─────────────────────────────────────────────────────────
   5. SMART PATTERN DISCOVERY
   ───────────────────────────────────────────────────────── */
export function discoverSmartPatterns(
  trades: Trade[],
  metrics: PerformanceMetrics,
  daily: DailyPerformance[],
  hourly: HourlyPerformance[],
  monthly: MonthlyPerformance[],
  lang: string = "en"
): ProfitablePattern[] {
  if (!trades || trades.length === 0) return [];

  const patterns: ProfitablePattern[] = [];

  const translateDay = (day: string) => {
    if (lang === "ar") {
      switch (day.toLowerCase()) {
        case "monday": return "الاثنين";
        case "tuesday": return "الثلاثاء";
        case "wednesday": return "الأربعاء";
        case "thursday": return "الخميس";
        case "friday": return "الجمعة";
        case "saturday": return "السبت";
        case "sunday": return "الأحد";
        default: return day;
      }
    } else if (lang === "fr") {
      switch (day.toLowerCase()) {
        case "monday": return "Lundi";
        case "tuesday": return "Mardi";
        case "wednesday": return "Mercredi";
        case "thursday": return "Jeudi";
        case "friday": return "Vendredi";
        case "saturday": return "Samedi";
        case "sunday": return "Dimanche";
        default: return day;
      }
    }
    return day;
  };

  const translateSession = (sess: string) => {
    if (lang === "ar") {
      switch (sess.toLowerCase()) {
        case "new york": return "نيويورك";
        case "london": return "لندن";
        case "asia": return "آسيا";
        default: return sess;
      }
    } else if (lang === "fr") {
      switch (sess.toLowerCase()) {
        case "new york": return "New York";
        case "london": return "Londres";
        case "asia": return "Asie";
        default: return sess;
      }
    }
    return sess;
  };

  // A. Weekday Pattern
  if (daily && daily.length > 0) {
    const sortedDaily = [...daily].sort((a, b) => b.netProfit - a.netProfit);
    const bestDay = sortedDaily[0];
    const worstDay = sortedDaily[sortedDaily.length - 1];

    if (bestDay && bestDay.netProfit > 0) {
      const translatedDayName = translateDay(bestDay.dayName);
      let cat = "Calendar Edge";
      let title = `Prime Day: ${translatedDayName}`;
      let evidence = `${translatedDayName} is your most profitable trading day with a cumulative return of +$${bestDay.netProfit.toFixed(2)} and a win rate of ${bestDay.winRate.toFixed(1)}%.`;
      let metricsStr = `${bestDay.trades} trades | Win rate: ${bestDay.winRate.toFixed(0)}%`;

      if (lang === "ar") {
        cat = "ميزة التقويم";
        title = `اليوم الأفضل: ${translatedDayName}`;
        evidence = `يعد يوم ${translatedDayName} هو يوم تداولك الأكثر ربحية بعائد تراكمي قدره +$${bestDay.netProfit.toFixed(2)} ونسبة فوز بلغت ${bestDay.winRate.toFixed(1)}%.`;
        metricsStr = `${bestDay.trades} صفقات | نسبة الفوز: ${bestDay.winRate.toFixed(0)}%`;
      } else if (lang === "fr") {
        cat = "Avantage Calendrier";
        title = `Jour Idéal: ${translatedDayName}`;
        evidence = `${translatedDayName} est votre jour le plus profitable avec un gain cumulé de +$${bestDay.netProfit.toFixed(2)} et un taux de réussite de ${bestDay.winRate.toFixed(1)}%.`;
        metricsStr = `${bestDay.trades} trades | Taux de réussite: ${bestDay.winRate.toFixed(0)}%`;
      }

      patterns.push({ type: "positive", category: cat, title, evidence, metrics: metricsStr });
    }

    if (worstDay && worstDay.netProfit < 0) {
      const translatedDayName = translateDay(worstDay.dayName);
      let cat = "Calendar Risk";
      let title = `Sinking Day: ${translatedDayName}`;
      let evidence = `${translatedDayName} is a severe drag on your performance, draining -$${Math.abs(worstDay.netProfit).toFixed(2)} with a low win rate of ${worstDay.winRate.toFixed(1)}%.`;
      let metricsStr = `${worstDay.trades} trades | Win rate: ${worstDay.winRate.toFixed(0)}%`;

      if (lang === "ar") {
        cat = "مخاطر التقويم";
        title = `اليوم الأسوأ: ${translatedDayName}`;
        evidence = `يمثل يوم ${translatedDayName} عبئاً كبيراً على أدائك، حيث يستنزف -$${Math.abs(worstDay.netProfit).toFixed(2)} مع نسبة فوز منخفضة بلغت ${worstDay.winRate.toFixed(1)}%.`;
        metricsStr = `${worstDay.trades} صفقات | نسبة الفوز: ${worstDay.winRate.toFixed(0)}%`;
      } else if (lang === "fr") {
        cat = "Risque Calendrier";
        title = `Jour Sombre: ${translatedDayName}`;
        evidence = `${translatedDayName} est un frein majeur pour votre performance, drainant -$${Math.abs(worstDay.netProfit).toFixed(2)} avec un faible taux de réussite de ${worstDay.winRate.toFixed(1)}%.`;
        metricsStr = `${worstDay.trades} trades | Taux de réussite: ${worstDay.winRate.toFixed(0)}%`;
      }

      patterns.push({ type: "negative", category: cat, title, evidence, metrics: metricsStr });
    }
  }

  // B. Hourly Pattern
  if (hourly && hourly.length > 0) {
    const sortedHourly = [...hourly].sort((a, b) => b.netProfit - a.netProfit);
    const bestHour = sortedHourly[0];
    const worstHour = sortedHourly[sortedHourly.length - 1];

    if (bestHour && bestHour.netProfit > 0) {
      let cat = "Intraday Edge";
      let title = `Peak Hour: ${bestHour.hour}:00 UTC`;
      let evidence = `Positions opened during this hour generate maximum returns of +$${bestHour.netProfit.toFixed(2)} and show superior execution.`;
      let metricsStr = `${bestHour.trades} trades | Win rate: ${bestHour.winRate.toFixed(0)}%`;

      if (lang === "ar") {
        cat = "ميزة التداول اليومي";
        title = `ساعة الذروة: ${bestHour.hour}:00 UTC`;
        evidence = `تحقق المراكز المفتوحة خلال هذه الساعة أقصى قدر من الأرباح بقيمة +$${bestHour.netProfit.toFixed(2)} وتظهر جودة تنفيذ متفوقة.`;
        metricsStr = `${bestHour.trades} صفقات | نسبة الفوز: ${bestHour.winRate.toFixed(0)}%`;
      } else if (lang === "fr") {
        cat = "Avantage Intra-journalier";
        title = `Heure de Pointe: ${bestHour.hour}:00 UTC`;
        evidence = `Les positions ouvertes durant cette heure génèrent des gains optimaux de +$${bestHour.netProfit.toFixed(2)} et montrent une exécution supérieure.`;
        metricsStr = `${bestHour.trades} trades | Taux de réussite: ${bestHour.winRate.toFixed(0)}%`;
      }

      patterns.push({ type: "positive", category: cat, title, evidence, metrics: metricsStr });
    }

    if (worstHour && worstHour.netProfit < 0) {
      let cat = "Intraday Risk";
      let title = `Vulnerable Hour: ${worstHour.hour}:00 UTC`;
      let evidence = `Trading during this hour causes significant decay, resulting in cumulatively -$${Math.abs(worstHour.netProfit).toFixed(2)} in losses.`;
      let metricsStr = `${worstHour.trades} trades | Win rate: ${worstHour.winRate.toFixed(0)}%`;

      if (lang === "ar") {
        cat = "مخاطر التداول اليومي";
        title = `الساعة الحرجة: ${worstHour.hour}:00 UTC`;
        evidence = `يتسبب التداول خلال هذه الساعة في تراجع كبير، مما يؤدي إلى خسائر تراكمية بقيمة -$${Math.abs(worstHour.netProfit).toFixed(2)}.`;
        metricsStr = `${worstHour.trades} صفقات | نسبة الفوز: ${worstHour.winRate.toFixed(0)}%`;
      } else if (lang === "fr") {
        cat = "Risque Intra-journalier";
        title = `Heure Vulnérable: ${worstHour.hour}:00 UTC`;
        evidence = `Le trading durant cette heure provoque une baisse importante, entraînant des pertes cumulées de -$${Math.abs(worstHour.netProfit).toFixed(2)}.`;
        metricsStr = `${worstHour.trades} trades | Taux de réussite: ${worstHour.winRate.toFixed(0)}%`;
      }

      patterns.push({ type: "negative", category: cat, title, evidence, metrics: metricsStr });
    }
  }

  // C. Session Pattern
  let bestSessionName = "Asia";
  let bestSessionProfit = -Infinity;
  let worstSessionName = "Asia";
  let worstSessionProfit = Infinity;

  const NYTrades = trades.filter(t => {
    const h = t.openTime.getUTCHours();
    return h >= 13 && h < 22;
  });
  const LondonTrades = trades.filter(t => {
    const h = t.openTime.getUTCHours();
    return h >= 7 && h < 13;
  });
  const AsiaTrades = trades.filter(t => {
    const h = t.openTime.getUTCHours();
    return (h >= 0 && h < 7) || h >= 22;
  });

  const sessionList = [
    { name: "New York", trades: NYTrades },
    { name: "London", trades: LondonTrades },
    { name: "Asia", trades: AsiaTrades }
  ];

  for (const s of sessionList) {
    const profit = s.trades.reduce((sum, t) => sum + t.netProfit, 0);
    if (s.trades.length > 0) {
      if (profit > bestSessionProfit) {
        bestSessionProfit = profit;
        bestSessionName = s.name;
      }
      if (profit < worstSessionProfit) {
        worstSessionProfit = profit;
        worstSessionName = s.name;
      }
    }
  }

  if (bestSessionProfit > 0) {
    const sTrades = sessionList.find(s => s.name === bestSessionName)!.trades;
    const wins = sTrades.filter(t => t.netProfit > 0).length;
    const wr = (wins / sTrades.length) * 100;
    const translatedSessName = translateSession(bestSessionName);
    
    let cat = "Market Session Edge";
    let title = `Dominating ${bestSessionName} Session`;
    let evidence = `You hold a clear statistical edge during the ${bestSessionName} session. Total session net return is +$${bestSessionProfit.toFixed(2)}.`;
    let metricsStr = `${sTrades.length} trades | Win rate: ${wr.toFixed(0)}%`;

    if (lang === "ar") {
      cat = "ميزة جلسة السوق";
      title = `السيطرة في جلسة ${translatedSessName}`;
      evidence = `لديك ميزة إحصائية واضحة خلال جلسة ${translatedSessName}. بلغ إجمالي صافي عائد الجلسة +$${bestSessionProfit.toFixed(2)}.`;
      metricsStr = `${sTrades.length} صفقات | نسبة الفوز: ${wr.toFixed(0)}%`;
    } else if (lang === "fr") {
      cat = "Avantage Session de Marché";
      title = `Domination de la Session ${translatedSessName}`;
      evidence = `Vous détenez un net avantage statistique durant la session de ${translatedSessName}. Le rendement net de la session est de +$${bestSessionProfit.toFixed(2)}.`;
      metricsStr = `${sTrades.length} trades | Taux de réussite: ${wr.toFixed(0)}%`;
    }

    patterns.push({ type: "positive", category: cat, title, evidence, metrics: metricsStr });
  }

  if (worstSessionProfit < 0) {
    const sTrades = sessionList.find(s => s.name === worstSessionName)!.trades;
    const wins = sTrades.filter(t => t.netProfit > 0).length;
    const wr = (wins / sTrades.length) * 100;
    const translatedSessName = translateSession(worstSessionName);

    let cat = "Market Session Risk";
    let title = `Bleeding in ${worstSessionName} Session`;
    let evidence = `Executing trades during the ${worstSessionName} session causes severe capital loss, totaling -$${Math.abs(worstSessionProfit).toFixed(2)}.`;
    let metricsStr = `${sTrades.length} trades | Win rate: ${wr.toFixed(0)}%`;

    if (lang === "ar") {
      cat = "مخاطر جلسة السوق";
      title = `خسائر في جلسة ${translatedSessName}`;
      evidence = `يتسبب تنفيذ الصفقات خلال جلسة ${translatedSessName} في خسارة رأس مال شديدة، بإجمالي -$${Math.abs(worstSessionProfit).toFixed(2)}.`;
      metricsStr = `${sTrades.length} صفقات | نسبة الفوز: ${wr.toFixed(0)}%`;
    } else if (lang === "fr") {
      cat = "Risque Session de Marché";
      title = `Pertes en Session ${translatedSessName}`;
      evidence = `L'exécution de trades durant la session de ${translatedSessName} provoque de lourdes pertes de capital, totalisant -$${Math.abs(worstSessionProfit).toFixed(2)}.`;
      metricsStr = `${sTrades.length} trades | Taux de réussite: ${wr.toFixed(0)}%`;
    }

    patterns.push({ type: "negative", category: cat, title, evidence, metrics: metricsStr });
  }

  // D. Consecutive Sequence Pattern (Streaks)
  let tradesAfter2Wins = 0;
  let winsAfter2Wins = 0;
  let profitAfter2Wins = 0;
  let tradesAfter2Losses = 0;
  let winsAfter2Losses = 0;
  let profitAfter2Losses = 0;

  for (let i = 2; i < trades.length; i++) {
    const t_prev2 = trades[i - 2];
    const t_prev1 = trades[i - 1];
    const curr = trades[i];

    if (t_prev2.netProfit > 0 && t_prev1.netProfit > 0) {
      tradesAfter2Wins++;
      if (curr.netProfit > 0) winsAfter2Wins++;
      profitAfter2Wins += curr.netProfit;
    } else if (t_prev2.netProfit < 0 && t_prev1.netProfit < 0) {
      tradesAfter2Losses++;
      if (curr.netProfit > 0) winsAfter2Losses++;
      profitAfter2Losses += curr.netProfit;
    }
  }

  if (tradesAfter2Losses > 3) {
    const wrAfterLoss = (winsAfter2Losses / tradesAfter2Losses) * 100;
    if (profitAfter2Losses < 0 && wrAfterLoss < 35) {
      let cat = "Sequence Trap";
      let title = "Loss Spiral Trajectory";
      let evidence = `Following 2 consecutive losses, your next trade has a very low win rate of ${wrAfterLoss.toFixed(1)}% and cumulatively drops -$${Math.abs(profitAfter2Losses).toFixed(2)}. This points to severe emotional spiral trading.`;
      let metricsStr = `${tradesAfter2Losses} spiral trades | Win rate: ${wrAfterLoss.toFixed(0)}%`;

      if (lang === "ar") {
        cat = "فخ التتابع";
        title = "مسار دوامة الخسارة";
        evidence = `بعد تعرضك لخسارتين متتاليتين، تنخفض نسبة فوز صفقتك التالية إلى ${wrAfterLoss.toFixed(1)}% وتتراجع تراكمياً بقيمة -$${Math.abs(profitAfter2Losses).toFixed(2)}. يشير هذا إلى تداول عاطفي متكرر.`;
        metricsStr = `${tradesAfter2Losses} صفقات دوامة | نسبة الفوز: ${wrAfterLoss.toFixed(0)}%`;
      } else if (lang === "fr") {
        cat = "Piège de Séquence";
        title = "Trajectoire en Spirale de Pertes";
        evidence = `Après 2 pertes consécutives, votre trade suivant a un très faible taux de réussite de ${wrAfterLoss.toFixed(1)}% et perd cumulativement -$${Math.abs(profitAfter2Losses).toFixed(2)}. Cela indique un trading de spirale émotionnelle.`;
        metricsStr = `${tradesAfter2Losses} trades spirales | Taux de réussite: ${wrAfterLoss.toFixed(0)}%`;
      }

      patterns.push({ type: "negative", category: cat, title, evidence, metrics: metricsStr });
    }
  }

  if (tradesAfter2Wins > 3) {
    const wrAfterWin = (winsAfter2Wins / tradesAfter2Wins) * 100;
    if (profitAfter2Wins > 0 && wrAfterWin > 55) {
      let cat = "Sequence Edge";
      let title = "Flow State Streak Optimization";
      let evidence = `Following 2 consecutive wins, your continuation trade is highly reliable, yielding +$${profitAfter2Wins.toFixed(2)} net profit with a ${wrAfterWin.toFixed(1)}% win rate.`;
      let metricsStr = `${tradesAfter2Wins} continuation trades | Win rate: ${wrAfterWin.toFixed(0)}%`;

      if (lang === "ar") {
        cat = "ميزة التتابع";
        title = "تحسين سلسلة حالة التدفق";
        evidence = `بعد تحقيق انتصارين متتاليين، تصبح صفقتك التالية موثوقة للغاية، حيث تحقق صافي ربح قدره +$${profitAfter2Wins.toFixed(2)} بنسبة فوز بلغت ${wrAfterWin.toFixed(1)}%.`;
        metricsStr = `${tradesAfter2Wins} صفقات تتابعية | نسبة الفوز: ${wrAfterWin.toFixed(0)}%`;
      } else if (lang === "fr") {
        cat = "Avantage Séquence";
        title = "Optimisation de Série Positive";
        evidence = `Après 2 gains consécutifs, votre trade de continuation est hautement fiable, générant +$${profitAfter2Wins.toFixed(2)} de profit net avec un taux de réussite de ${wrAfterWin.toFixed(1)}%.`;
        metricsStr = `${tradesAfter2Wins} trades de continuation | Taux de réussite: ${wrAfterWin.toFixed(0)}%`;
      }

      patterns.push({ type: "positive", category: cat, title, evidence, metrics: metricsStr });
    }
  }

  // E. Best Lot Size Edge
  const lotsMap = new Map<number, { trades: number; profit: number }>();
  for (const t of trades) {
    const vol = t.volume;
    if (!lotsMap.has(vol)) lotsMap.set(vol, { trades: 0, profit: 0 });
    const stat = lotsMap.get(vol)!;
    stat.trades++;
    stat.profit += t.netProfit;
  }
  const lotStatsList = Array.from(lotsMap.entries()).filter(([_, stat]) => stat.trades >= 3);
  if (lotStatsList.length >= 2) {
    const sortedLots = lotStatsList.sort((a, b) => b[1].profit - a[1].profit);
    const bestLot = sortedLots[0];
    const worstLot = sortedLots[sortedLots.length - 1];

    if (bestLot && bestLot[1].profit > 0) {
      let cat = "Position Size Edge";
      let title = `Optimized Size: ${bestLot[0]} Lots`;
      let evidence = `Trading with exactly ${bestLot[0]} lots is your statistical Sweet Spot, yielding +$${bestLot[1].profit.toFixed(2)} in net returns.`;
      let metricsStr = `${bestLot[1].trades} trades | Net profit: +$${bestLot[1].profit.toFixed(0)}`;

      if (lang === "ar") {
        cat = "ميزة حجم الصفقة";
        title = `الحجم المثالي: ${bestLot[0]} لوت`;
        evidence = `يمثل التداول بحجم ${bestLot[0]} لوت نقطة القوة الإحصائية لديك، حيث حقق عائداً صافياً بقيمة +$${bestLot[1].profit.toFixed(2)}.`;
        metricsStr = `${bestLot[1].trades} صفقات | صافي الأرباح: +$${bestLot[1].profit.toFixed(0)}`;
      } else if (lang === "fr") {
        cat = "Avantage Taille de Position";
        title = `Taille Optimisée: ${bestLot[0]} Lots`;
        evidence = `Négocier avec exactement ${bestLot[0]} lots est votre zone de confort statistique, générant +$${bestLot[1].profit.toFixed(2)} de rendement net.`;
        metricsStr = `${bestLot[1].trades} trades | Profit net: +$${bestLot[1].profit.toFixed(0)}`;
      }

      patterns.push({ type: "positive", category: cat, title, evidence, metrics: metricsStr });
    }
    if (worstLot && worstLot[1].profit < 0) {
      let cat = "Position Size Risk";
      let title = `Unstable Size: ${worstLot[0]} Lots`;
      let evidence = `Trading with ${worstLot[0]} lots drops your curve, draining -$${Math.abs(worstLot[1].profit).toFixed(2)} in capital.`;
      let metricsStr = `${worstLot[1].trades} trades | Net loss: -$${Math.abs(worstLot[1].profit).toFixed(0)}`;

      if (lang === "ar") {
        cat = "مخاطر حجم الصفقة";
        title = `حجم غير مستقر: ${worstLot[0]} لوت`;
        evidence = `يتسبب التداول بحجم ${worstLot[0]} لوت في تراجع حسابك، مما يستنزف -$${Math.abs(worstLot[1].profit).toFixed(2)} من رأس المال.`;
        metricsStr = `${worstLot[1].trades} صفقات | صافي الخسارة: -$${Math.abs(worstLot[1].profit).toFixed(0)}`;
      } else if (lang === "fr") {
        cat = "Risque Taille de Position";
        title = `Taille Instable: ${worstLot[0]} Lots`;
        evidence = `Négocier avec ${worstLot[0]} lots affecte négativement votre courbe, drainant -$${Math.abs(worstLot[1].profit).toFixed(2)} de capital.`;
        metricsStr = `${worstLot[1].trades} trades | Perte nette: -$${Math.abs(worstLot[1].profit).toFixed(0)}`;
      }

      patterns.push({ type: "negative", category: cat, title, evidence, metrics: metricsStr });
    }
  }

  return patterns;
}

/* ─────────────────────────────────────────────────────────
   6. BEST VS WORST TRADES COMPARISON
   ───────────────────────────────────────────────────────── */
export function compareBestVsWorst(trades: Trade[], lang: string = "en"): BestVsWorstResult {
  if (!trades || trades.length < 5) {
    const blankGroup: TradeComparisonGroup = { count: 0, avgProfit: 0, avgDurationMinutes: 0, avgLots: 0, winRate: 0, buyRatio: 0, commonHour: 12, commonDay: "Monday", commonSymbol: "None", avgSwap: 0 };
    let fallbackMsg = "Upload more trades to unlock top vs worst quantile analysis.";
    if (lang === "ar") {
      fallbackMsg = "قم برفع المزيد من الصفقات لفتح تحليل شريحة الأفضل مقابل الأسوأ.";
    } else if (lang === "fr") {
      fallbackMsg = "Téléchargez plus de trades pour débloquer l'analyse quantile meilleur vs pire.";
    }
    return { top10: blankGroup, top25: blankGroup, worst10: blankGroup, worst25: blankGroup, conclusions: [fallbackMsg], bestSession: "Asia", worstSession: "London", bestExplanation: fallbackMsg };
  }

  // Sort trades by profit (descending)
  const sorted = [...trades].sort((a, b) => b.netProfit - a.netProfit);
  const total = sorted.length;

  const getSliceIndices = (pct: number, top: boolean) => {
    const count = Math.max(1, Math.round(total * (pct / 100)));
    return top ? sorted.slice(0, count) : sorted.slice(total - count);
  };

  const top10Trades = getSliceIndices(10, true);
  const top25Trades = getSliceIndices(25, true);
  const worst10Trades = getSliceIndices(10, false);
  const worst25Trades = getSliceIndices(25, false);

  const analyzeGroup = (group: Trade[]): TradeComparisonGroup => {
    const count = group.length;
    if (count === 0) return { count: 0, avgProfit: 0, avgDurationMinutes: 0, avgLots: 0, winRate: 0, buyRatio: 0, commonHour: 12, commonDay: "Monday", commonSymbol: "None", avgSwap: 0 };
    
    const wins = group.filter(t => t.netProfit > 0);
    const winRate = (wins.length / count) * 100;

    const avgProfit = group.reduce((sum, t) => sum + t.netProfit, 0) / count;
    const avgDurationMinutes = group.reduce((sum, t) => sum + t.durationMinutes, 0) / count;
    const avgLots = group.reduce((sum, t) => sum + t.volume, 0) / count;
    const buyRatio = group.filter(t => t.type === "buy").length / count;
    const avgSwap = group.reduce((sum, t) => sum + t.swap, 0) / count;

    // Find most common hour
    const hourMap = new Map<number, number>();
    for (const t of group) {
      const h = t.openTime.getUTCHours();
      hourMap.set(h, (hourMap.get(h) || 0) + 1);
    }
    const commonHour = Array.from(hourMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 12;

    // Find most common day
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayMap = new Map<string, number>();
    for (const t of group) {
      const d = DAYS[t.openTime.getUTCDay()];
      dayMap.set(d, (dayMap.get(d) || 0) + 1);
    }
    const commonDay = Array.from(dayMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Monday";

    // Find most common symbol
    const symMap = new Map<string, number>();
    for (const t of group) {
      const s = t.symbol;
      symMap.set(s, (symMap.get(s) || 0) + 1);
    }
    const commonSymbol = Array.from(symMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown";

    return {
      count,
      avgProfit,
      avgDurationMinutes,
      avgLots,
      winRate,
      buyRatio,
      commonHour,
      commonDay,
      commonSymbol,
      avgSwap
    };
  };

  const top10 = analyzeGroup(top10Trades);
  const top25 = analyzeGroup(top25Trades);
  const worst10 = analyzeGroup(worst10Trades);
  const worst25 = analyzeGroup(worst25Trades);

  // Generate dynamic conclusions comparing top 25% vs worst 25%
  const conclusions: string[] = [];

  // Comparison 1: Duration Differences
  if (top25.avgDurationMinutes > worst25.avgDurationMinutes * 1.5) {
    const ratio = top25.avgDurationMinutes / Math.max(1, worst25.avgDurationMinutes);
    let msg = `Your profitable trades stay open ${ratio.toFixed(1)}x longer than losing trades. This shows that giving your trades time to breathe is critical for your winning edge.`;
    if (lang === "ar") {
      msg = `تظل صفقاتك الرابحة مفتوحة لفترة أطول بـ ${ratio.toFixed(1)} أضعاف مقارنة بالصفقات الخاسرة. وهذا يدل على أن إعطاء صفقاتك وقتاً للتنفس أمر بالغ الأهمية لميزتك الرابحة.`;
    } else if (lang === "fr") {
      msg = `Vos positions gagnantes restent ouvertes ${ratio.toFixed(1)}x plus longtemps que vos pertes. Cela démontre que laisser respirer vos trades est crucial pour votre avantage.`;
    }
    conclusions.push(msg);
  } else if (worst25.avgDurationMinutes > top25.avgDurationMinutes * 1.5) {
    const ratio = worst25.avgDurationMinutes / Math.max(1, top25.avgDurationMinutes);
    let msg = `Losing positions are held ${ratio.toFixed(1)}x longer than winning positions. You are holding onto losers hoping for recovery, while cutting your winners too early.`;
    if (lang === "ar") {
      msg = `يتم الاحتفاظ بالمراكز الخاسرة لفترة أطول بـ ${ratio.toFixed(1)} أضعاف مقارنة بالمراكز الرابحة. إنك تتمسك بالخاسرين على أمل التعافي، بينما تقطع أرباحك مبكراً جداً.`;
    } else if (lang === "fr") {
      msg = `Vos positions perdantes sont conservées ${ratio.toFixed(1)}x plus longtemps que vos gains. Vous conservez vos pertes en espérant un retour à l'équilibre, tout en coupant vos gains trop tôt.`;
    }
    conclusions.push(msg);
  }

  // Comparison 2: Position sizing differences
  if (worst25.avgLots > top25.avgLots * 1.2) {
    const ratio = worst25.avgLots / top25.avgLots;
    let msg = `Losing trades utilize positions that are ${((ratio - 1) * 100).toFixed(0)}% larger than your winning trades. You are risk-loading or size-bombing on lower-probability setups.`;
    if (lang === "ar") {
      msg = `تستخدم الصفقات الخاسرة أحجام عقود أكبر بنسبة ${((ratio - 1) * 100).toFixed(0)}% مقارنة بصفقاتك الرابحة. إنك تفرط في تحميل المخاطر أو زيادة حجم العقود على صفقات ذات احتمالية نجاح منخفضة.`;
    } else if (lang === "fr") {
      msg = `Vos trades perdants utilisent des tailles de position ${((ratio - 1) * 100).toFixed(0)}% plus grandes que vos gains. Vous surchargez votre risque sur des configurations à faible probabilité.`;
    }
    conclusions.push(msg);
  } else if (top25.avgLots > worst25.avgLots * 1.2) {
    let msg = `Your top trades are heavily sized (average ${top25.avgLots.toFixed(2)} lots vs ${worst25.avgLots.toFixed(2)} lots for losers). This indicates highly positive execution where you correctly increase size when high-probability opportunities arise.`;
    if (lang === "ar") {
      msg = `صفقاتك الأفضل تأتي بأحجام عقود كبيرة (بمتوسط ${top25.avgLots.toFixed(2)} لوت مقابل ${worst25.avgLots.toFixed(2)} لوت للخاسرين). يشير هذا إلى تنفيذ إيجابي للغاية حيث تزيد حجم عقودك بشكل صحيح عندما تتاح الفرص عالية الاحتمال.`;
    } else if (lang === "fr") {
      msg = `Vos meilleurs trades ont des tailles importantes (moyenne de ${top25.avgLots.toFixed(2)} lots contre ${worst25.avgLots.toFixed(2)} lots pour les perdants). Cela indique une exécution positive où vous augmentez correctement la taille lors d'opportunités à haute probabilité.`;
    }
    conclusions.push(msg);
  }

  // Comparison 3: Asset selection
  if (top25.commonSymbol !== worst25.commonSymbol) {
    let msg = `Your best results focus primarily on ${top25.commonSymbol}, whereas your worst losses accumulate heavily on ${worst25.commonSymbol}. Stop trading ${worst25.commonSymbol} and focus capital on ${top25.commonSymbol}.`;
    if (lang === "ar") {
      msg = `تركز أفضل نتائجك بشكل أساسي على ${top25.commonSymbol}، بينما تتراكم أسوأ خسائرك بكثافة على ${worst25.commonSymbol}. توقف عن تداول ${worst25.commonSymbol} وركز رأس مالك على ${top25.commonSymbol}.`;
    } else if (lang === "fr") {
      msg = `Vos meilleurs résultats se concentrent principalement sur ${top25.commonSymbol}, alors que vos pires pertes s'accumulent sur ${worst25.commonSymbol}. Arrêtez de trader ${worst25.commonSymbol} et concentrez votre capital sur ${top25.commonSymbol}.`;
    }
    conclusions.push(msg);
  } else {
    let msg = `Both your top and worst trades are on ${top25.commonSymbol}. This indicates excellent asset focus, but calls for refining precise technical entry filters.`;
    if (lang === "ar") {
      msg = `كل من صفقاتك الأفضل والأسوأ تتم على ${top25.commonSymbol}. يشير هذا إلى تركيز ممتاز على الأصل المالي، ولكنه يتطلب تحسين فلاتر الدخول الفنية الدقيقة.`;
    } else if (lang === "fr") {
      msg = `Vos meilleurs et pires trades concernent tous deux ${top25.commonSymbol}. Cela indique une excellente concentration d'actifs, mais nécessite d'affiner vos filtres d'entrée techniques.`;
    }
    conclusions.push(msg);
  }

  // Comparison 4: Time of entry
  if (top25.commonHour !== worst25.commonHour) {
    let msg = `Your most profitable positions are entered at ${top25.commonHour}:00 UTC, while your worst losses occur on positions entered at ${worst25.commonHour}:00 UTC.`;
    if (lang === "ar") {
      msg = `يتم فتح صفقاتك الأكثر ربحية عند الساعة ${top25.commonHour}:00 UTC، في حين تحدث أسوأ خسائرك في المراكز المفتوحة عند الساعة ${worst25.commonHour}:00 UTC.`;
    } else if (lang === "fr") {
      msg = `Vos positions les plus profitables sont ouvertes à ${top25.commonHour}:00 UTC, alors que vos pires pertes surviennent sur des positions ouvertes à ${worst25.commonHour}:00 UTC.`;
    }
    conclusions.push(msg);
  }

  // Session comparison
  const NYTrades = trades.filter(t => { const h = t.openTime.getUTCHours(); return h >= 13 && h < 22; });
  const LondonTrades = trades.filter(t => { const h = t.openTime.getUTCHours(); return h >= 7 && h < 13; });
  const AsiaTrades = trades.filter(t => { const h = t.openTime.getUTCHours(); return (h >= 0 && h < 7) || h >= 22; });
  const sessionList = [
    { name: "New York", trades: NYTrades },
    { name: "London", trades: LondonTrades },
    { name: "Asia", trades: AsiaTrades }
  ];
  let bestSession = "Asia";
  let bestProfit = -Infinity;
  let worstSession = "London";
  let worstProfit = Infinity;
  for (const s of sessionList) {
    const profit = s.trades.reduce((sum, t) => sum + t.netProfit, 0);
    if (s.trades.length > 0) {
      if (profit > bestProfit) { bestProfit = profit; bestSession = s.name; }
      if (profit < worstProfit) { worstProfit = profit; worstSession = s.name; }
    }
  }
  const bestTrades = sessionList.find(s => s.name === bestSession)?.trades || [];
  const bestWr = bestTrades.length > 0 ? (bestTrades.filter(t => t.netProfit > 0).length / bestTrades.length) * 100 : 0;
  let bestExplanation = `${bestSession} session yields your highest return with +$${Math.max(0, bestProfit).toFixed(2)} net profit (${bestWr.toFixed(0)}% win rate).`;
  if (lang === "ar") {
    bestExplanation = `تكتسب جلسة ${bestSession} أعلى عائد لك بصافي أرباح +$${Math.max(0, bestProfit).toFixed(2)} (نسبة فوز ${bestWr.toFixed(0)}%).`;
  } else if (lang === "fr") {
    bestExplanation = `La session ${bestSession} génère votre meilleur rendement avec +$${Math.max(0, bestProfit).toFixed(2)} de profit net (${bestWr.toFixed(0)}% de réussite).`;
  }

  return { top10, top25, worst10, worst25, conclusions, bestSession, worstSession, bestExplanation };
}

/* ─────────────────────────────────────────────────────────
   7. WHAT-IF SIMULATION ENGINE
   ───────────────────────────────────────────────────────── */
export function runWhatIfSimulation(
  trades: Trade[],
  originalMetrics: PerformanceMetrics,
  rules: SimulationRules,
  lang: string = "en"
): SimulationResult {
  const original = {
    netProfit: originalMetrics.netProfit,
    winRate: originalMetrics.winRate,
    profitFactor: originalMetrics.profitFactor,
    expectancy: originalMetrics.expectancy,
    totalTrades: originalMetrics.totalTrades,
    maxDrawdown: originalMetrics.maxDrawdownPercent
  };

  if (!trades || trades.length === 0) {
    return { original, simulated: original, diffs: { netProfit: 0, winRate: 0, profitFactor: 0, expectancy: 0, totalTrades: 0 }, insights: [] };
  }

  // Filter and transform trades
  let simulatedTrades = [...trades];

  // Rule 1: Skip Fridays
  if (rules.skipFridays) {
    simulatedTrades = simulatedTrades.filter(t => t.openTime.getUTCDay() !== 5);
  }

  // Rule 2: Only London Session
  if (rules.onlyLondon) {
    simulatedTrades = simulatedTrades.filter(t => {
      const h = t.openTime.getUTCHours();
      return h >= 7 && h < 13;
    });
  }

  // Rule 3: Ignore Trades After Hour
  if (rules.ignoreAfterHour !== undefined && rules.ignoreAfterHour > 0) {
    simulatedTrades = simulatedTrades.filter(t => t.openTime.getUTCHours() <= rules.ignoreAfterHour!);
  }

  // Rule 4: Stop trading on any day after N consecutive losses
  if (rules.stopLossLimit > 0) {
    // Group trades by day, then enforce rule
    const tradesByDay = new Map<string, Trade[]>();
    for (const t of simulatedTrades) {
      const dStr = t.openTime.toDateString();
      if (!tradesByDay.has(dStr)) tradesByDay.set(dStr, []);
      tradesByDay.get(dStr)!.push(t);
    }

    const filtered: Trade[] = [];
    for (const [_, dayTrades] of tradesByDay.entries()) {
      // Sort day trades chronologically
      dayTrades.sort((a, b) => a.openTime.getTime() - b.openTime.getTime());
      
      let consecutiveLosses = 0;
      for (const t of dayTrades) {
        if (consecutiveLosses >= rules.stopLossLimit) {
          // Skip this trade - rule is active!
          continue;
        }
        filtered.push(t);
        if (t.netProfit < 0) {
          consecutiveLosses++;
        } else if (t.netProfit > 0) {
          consecutiveLosses = 0; // reset
        }
      }
    }
    simulatedTrades = filtered;
  }

  // Rule 5: Risk 1% instead of actual
  const avgActualLoss = Math.abs(originalMetrics.averageLoss) || 100;
  if (rules.riskPercent && rules.riskPercent > 0) {
    const targetRisk = 10000 * (rules.riskPercent / 100); // e.g. $100 for 1% risk
    simulatedTrades = simulatedTrades.map(t => {
      let scaledProfit = t.netProfit;
      if (t.netProfit < 0) {
        scaledProfit = -targetRisk;
      } else if (t.netProfit > 0) {
        const actualWinToAvgLossRatio = t.netProfit / avgActualLoss;
        scaledProfit = actualWinToAvgLossRatio * targetRisk;
      }
      return {
        ...t,
        netProfit: scaledProfit
      };
    });
  }

  // Calculate simulated metrics
  const totalTrades = simulatedTrades.length;
  const wins = simulatedTrades.filter(t => t.netProfit > 0);
  const losses = simulatedTrades.filter(t => t.netProfit < 0);
  
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const netProfit = simulatedTrades.reduce((sum, t) => sum + t.netProfit, 0);
  
  const grossProfit = wins.reduce((sum, t) => sum + t.netProfit, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.netProfit, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 5.0 : 1.0;
  const expectancy = totalTrades > 0 ? netProfit / totalTrades : 0;

  // Max drawdown percent simulation
  let maxDd = 0;
  let balance = 10000;
  let peak = balance;
  for (const t of simulatedTrades) {
    balance += t.netProfit;
    if (balance > peak) peak = balance;
    const dd = ((peak - balance) / peak) * 100;
    if (dd > maxDd) maxDd = dd;
  }

  const simulated = {
    netProfit,
    winRate,
    profitFactor,
    expectancy,
    totalTrades,
    maxDrawdown: maxDd || originalMetrics.maxDrawdownPercent * 0.8
  };

  // Diff metrics
  const diffs = {
    netProfit: simulated.netProfit - original.netProfit,
    winRate: simulated.winRate - original.winRate,
    profitFactor: simulated.profitFactor - original.profitFactor,
    expectancy: simulated.expectancy - original.expectancy,
    totalTrades: simulated.totalTrades - original.totalTrades
  };

  // Generate simulated insights
  const insights: string[] = [];
  if (diffs.netProfit > 100) {
    let msg = `Implementing this simulation would increase your overall return by +$${diffs.netProfit.toFixed(2)}.`;
    if (lang === "ar") {
      msg = `سيؤدي تطبيق هذه المحاكاة إلى زيادة عائدك الإجمالي بمقدار +$${diffs.netProfit.toFixed(2)}.`;
    } else if (lang === "fr") {
      msg = `L'implémentation de cette simulation augmenterait votre rendement global de +$${diffs.netProfit.toFixed(2)}.`;
    }
    insights.push(msg);
  } else if (diffs.netProfit < -100) {
    let msg = `This setup decreases returns by -$${Math.abs(diffs.netProfit).toFixed(2)}. Your actual raw strategy remains superior.`;
    if (lang === "ar") {
      msg = `يقلل هذا الإعداد العوائد بمقدار -$${Math.abs(diffs.netProfit).toFixed(2)}. تظل استراتيجيتك الفعلية الحالية متفوقة.`;
    } else if (lang === "fr") {
      msg = `Cette configuration diminue les rendements de -$${Math.abs(diffs.netProfit).toFixed(2)}. Votre stratégie réelle actuelle reste supérieure.`;
    }
    insights.push(msg);
  }

  if (simulated.winRate > original.winRate + 2) {
    let msg = `Your win rate would climb by +${(simulated.winRate - original.winRate).toFixed(1)}%, reducing consecutive loss streaks.`;
    if (lang === "ar") {
      msg = `سترتفع نسبة فوزك بمقدار +${(simulated.winRate - original.winRate).toFixed(1)}%، مما يقلل من سلاسل الخسائر المتتالية.`;
    } else if (lang === "fr") {
      msg = `Votre taux de réussite grimperait de +${(simulated.winRate - original.winRate).toFixed(1)}%, réduisant les séries de pertes consécutives.`;
    }
    insights.push(msg);
  }

  if (simulated.maxDrawdown < original.maxDrawdown - 1) {
    let msg = `Your maximum drawdown would drop from ${original.maxDrawdown.toFixed(1)}% to ${simulated.maxDrawdown.toFixed(1)}%, representing an extremely safe equity curve.`;
    if (lang === "ar") {
      msg = `سينخفض الحد الأقصى للتراجع من ${original.maxDrawdown.toFixed(1)}% إلى ${simulated.maxDrawdown.toFixed(1)}%، مما يمثل منحنى رأس مال آمن للغاية.`;
    } else if (lang === "fr") {
      msg = `Votre drawdown maximal chuterait de ${original.maxDrawdown.toFixed(1)}% à ${simulated.maxDrawdown.toFixed(1)}%, représentant une courbe de capital extrêmement sûre.`;
    }
    insights.push(msg);
  }

  if (rules.skipFridays && diffs.netProfit > 0) {
    let msg = `Skipping Friday trading is highly beneficial, eliminating bad trades and increasing overall efficiency.`;
    if (lang === "ar") {
      msg = `تجنب التداول يوم الجمعة مفيد للغاية، حيث يزيل الصفقات السيئة ويزيد الكفاءة العامة.`;
    } else if (lang === "fr") {
      msg = `Éviter le trading le vendredi est hautement bénéfique, éliminant les mauvais trades et augmentant l'efficacité globale.`;
    }
    insights.push(msg);
  }

  if (rules.stopLossLimit > 0 && diffs.netProfit > 0) {
    let msg = `Stopping after ${rules.stopLossLimit} losses saves you from daily revenge cycles, boosting profits.`;
    if (lang === "ar") {
      msg = `التوقف بعد ${rules.stopLossLimit} خسائر يحميك من دورات الانتقام اليومية، مما يعزز الأرباح.`;
    } else if (lang === "fr") {
      msg = `S'arrêter après ${rules.stopLossLimit} pertes vous préserve des cycles de revanche quotidiens, stimulant les profits.`;
    }
    insights.push(msg);
  }

  return { original, simulated, diffs, insights };
}
