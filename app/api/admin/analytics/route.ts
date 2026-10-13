import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/auth";

// Helper to determine estimated course value in INR
function getEstimatedCourseFee(courseName?: string | null): number {
  if (!courseName) return 25000;
  const c = courseName.toUpperCase();
  if (c.includes("JEE") || c.includes("IIT")) return 45000;
  if (c.includes("NEET") || c.includes("MEDICAL")) return 42000;
  if (c.includes("UPSC") || c.includes("IAS")) return 50000;
  if (c.includes("FOUNDATION") || c.includes("10TH") || c.includes("9TH")) return 28000;
  if (c.includes("CRASH")) return 15000;
  return 25000;
}

// Helper to compute start date from range key
function getRangeDetails(rangeKey: string, now: Date): { startDate: Date; label: string; daysCount: number } {
  if (rangeKey === "7d") {
    return { startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), label: "Last 7 Days", daysCount: 7 };
  }
  if (rangeKey === "30d") {
    return { startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), label: "Last 30 Days", daysCount: 30 };
  }
  if (rangeKey === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const days = Math.max(Math.ceil((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)), 1);
    return { startDate: start, label: "This Month", daysCount: days };
  }
  if (rangeKey === "all") {
    return { startDate: new Date(0), label: "All Time", daysCount: 60 };
  }
  return { startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), label: "Last 14 Days", daysCount: 14 };
}

export async function GET(req: NextRequest) {
  try {
    const context = await getOrganizationContext(req, ["ORG_ADMIN", "ADMIN", "SUPER_ADMIN"]);
    const orgId = context.organizationId;
    const { searchParams } = new URL(req.url);

    const rangeParam = searchParams.get("range") || "30d";
    const funnelRangeParam = searchParams.get("funnelRange") || "30d";
    const courseRangeParam = searchParams.get("courseRange") || "30d";
    const counsellorRangeParam = searchParams.get("counsellorRange") || "30d";

    const now = new Date();
    const globalRange = getRangeDetails(rangeParam, now);
    const funnelRange = getRangeDetails(funnelRangeParam, now);
    const courseRange = getRangeDetails(courseRangeParam, now);
    const counsellorRange = getRangeDetails(counsellorRangeParam, now);

    // Fetch all leads for this organization
    const allLeads = await prisma.lead.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        status: true,
        course: true,
        assignedToId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch all call activities
    const [allCallActivities, allWhatsAppCount] = await Promise.all([
      prisma.leadActivity.findMany({
        where: {
          organizationId: orgId,
          type: "CALL",
        },
        select: {
          id: true,
          userId: true,
          createdAt: true,
          response: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.whatsAppActivity.count({
        where: { organizationId: orgId },
      }),
    ]);

    // Fetch counsellors
    const counsellors = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        role: "COUNSELLOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    // =========================================================================
    // 1. GLOBAL SUMMARY & TRENDS (Using rangeParam)
    // =========================================================================
    const globalLeads = rangeParam === "all" ? allLeads : allLeads.filter((l) => new Date(l.createdAt) >= globalRange.startDate);
    const globalCalls = rangeParam === "all" ? allCallActivities : allCallActivities.filter((a) => new Date(a.createdAt) >= globalRange.startDate);

    const periodDurationMs = now.getTime() - globalRange.startDate.getTime();
    const priorStartDate = new Date(globalRange.startDate.getTime() - periodDurationMs);
    const priorLeads = allLeads.filter((l) => {
      const d = new Date(l.createdAt);
      return d >= priorStartDate && d < globalRange.startDate;
    });
    const priorCalls = allCallActivities.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= priorStartDate && d < globalRange.startDate;
    });

    let globalRevenue = 0;
    let globalConvertedCount = 0;
    let globalNoAnswerCount = 0;

    globalLeads.forEach((lead) => {
      if (lead.status === "CONVERTED") {
        globalConvertedCount++;
        globalRevenue += getEstimatedCourseFee(lead.course);
      } else if (lead.status === "NO_ANSWER") {
        globalNoAnswerCount++;
      }
    });

    let priorRevenue = 0;
    let priorConversions = 0;
    priorLeads.forEach((lead) => {
      if (lead.status === "CONVERTED") {
        priorConversions++;
        priorRevenue += getEstimatedCourseFee(lead.course);
      }
    });

    const leadsDelta = priorLeads.length > 0
      ? Math.round(((globalLeads.length - priorLeads.length) / priorLeads.length) * 100)
      : globalLeads.length > 0 ? 100 : 0;

    const callsDelta = priorCalls.length > 0
      ? Math.round(((globalCalls.length - priorCalls.length) / priorCalls.length) * 100)
      : globalCalls.length > 0 ? 100 : 0;

    const admissionsDelta = priorConversions > 0
      ? Math.round(((globalConvertedCount - priorConversions) / priorConversions) * 100)
      : globalConvertedCount > 0 ? 100 : 0;

    const revenueDelta = priorRevenue > 0
      ? Math.round(((globalRevenue - priorRevenue) / priorRevenue) * 100)
      : globalRevenue > 0 ? 100 : 0;

    const totalLeadsCount = globalLeads.length;
    const totalConversionRate = totalLeadsCount > 0 ? Math.round((globalConvertedCount / totalLeadsCount) * 1000) / 10 : 0;
    const avgTicketSize = globalConvertedCount > 0 ? Math.round(globalRevenue / globalConvertedCount) : 25000;

    // Build Time Series Day Array
    const trendMap: Record<string, { date: string; rawDate: string; calls: number; leads: number; cumulativeLeads: number; conversions: number; revenue: number }> = {};
    const daysCount = globalRange.daysCount;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      const displayDate = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      trendMap[key] = { date: displayDate, rawDate: key, calls: 0, leads: 0, cumulativeLeads: 0, conversions: 0, revenue: 0 };
    }

    allCallActivities.forEach((act) => {
      const k = new Date(act.createdAt).toISOString().split("T")[0];
      if (trendMap[k]) trendMap[k].calls++;
    });

    allLeads.forEach((l) => {
      const createdKey = new Date(l.createdAt).toISOString().split("T")[0];
      if (trendMap[createdKey]) trendMap[createdKey].leads++;
      if (l.status === "CONVERTED") {
        const convKey = new Date(l.updatedAt).toISOString().split("T")[0];
        if (trendMap[convKey]) {
          trendMap[convKey].conversions++;
          trendMap[convKey].revenue += getEstimatedCourseFee(l.course);
        }
      }
    });

    let runningLeadsCount = allLeads.filter((l) => new Date(l.createdAt) < globalRange.startDate).length;
    Object.keys(trendMap).forEach((key) => {
      runningLeadsCount += trendMap[key].leads;
      trendMap[key].cumulativeLeads = runningLeadsCount;
    });

    const dailyTrends = Object.values(trendMap);
    const dateRangeLabel = `${globalRange.startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - ${now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

    // Sparklines
    const sparklineBucketsCount = 6;
    const bucketDuration = (now.getTime() - globalRange.startDate.getTime()) / sparklineBucketsCount;
    const leadsSparkline = Array(sparklineBucketsCount).fill(0);
    const callsSparkline = Array(sparklineBucketsCount).fill(0);
    const admissionsSparkline = Array(sparklineBucketsCount).fill(0);
    const revenueSparkline = Array(sparklineBucketsCount).fill(0);

    for (let b = 0; b < sparklineBucketsCount; b++) {
      const bStart = new Date(globalRange.startDate.getTime() + b * bucketDuration);
      const bEnd = new Date(globalRange.startDate.getTime() + (b + 1) * bucketDuration);

      leadsSparkline[b] = allLeads.filter((l) => {
        const d = new Date(l.createdAt);
        return d >= bStart && d < bEnd;
      }).length;

      callsSparkline[b] = allCallActivities.filter((a) => {
        const d = new Date(a.createdAt);
        return d >= bStart && d < bEnd;
      }).length;

      const convertedInBucket = allLeads.filter((l) => {
        const d = new Date(l.updatedAt);
        return l.status === "CONVERTED" && d >= bStart && d < bEnd;
      });

      admissionsSparkline[b] = convertedInBucket.length;
      revenueSparkline[b] = convertedInBucket.reduce((sum, l) => sum + getEstimatedCourseFee(l.course), 0);
    }

    // =========================================================================
    // 2. ADMISSIONS FUNNEL (Using funnelRangeParam)
    // =========================================================================
    const funnelLeads = funnelRangeParam === "all" ? allLeads : allLeads.filter((l) => new Date(l.createdAt) >= funnelRange.startDate);
    const funnelStatusCounts = {
      NEW: 0,
      CONTACTED: 0,
      INTERESTED: 0,
      FOLLOW_UP: 0,
      CONVERTED: 0,
      NO_ANSWER: 0,
      NOT_INTERESTED: 0,
      WRONG_NUMBER: 0,
    };

    funnelLeads.forEach((l) => {
      const st = l.status as keyof typeof funnelStatusCounts;
      if (funnelStatusCounts[st] !== undefined) funnelStatusCounts[st]++;
    });

    const funnelTotalLeads = funnelLeads.length;
    const funnelContacted = funnelStatusCounts.CONTACTED + funnelStatusCounts.INTERESTED + funnelStatusCounts.FOLLOW_UP + funnelStatusCounts.CONVERTED;
    const funnelHighInterest = funnelStatusCounts.INTERESTED + funnelStatusCounts.FOLLOW_UP + funnelStatusCounts.CONVERTED;
    const funnelFollowUp = funnelStatusCounts.FOLLOW_UP + funnelStatusCounts.CONVERTED;
    const funnelConverted = funnelStatusCounts.CONVERTED;

    const funnelStages = [
      {
        stage: "Total Inquiries",
        count: funnelTotalLeads,
        percent: 100,
        color: "bg-blue-600",
      },
      {
        stage: "Contacted & Engaged",
        count: funnelContacted,
        percent: funnelTotalLeads > 0 ? Math.round((funnelContacted / funnelTotalLeads) * 100) : 0,
        color: "bg-blue-500",
      },
      {
        stage: "High Interest & Demos",
        count: funnelHighInterest,
        percent: funnelTotalLeads > 0 ? Math.round((funnelHighInterest / funnelTotalLeads) * 100) : 0,
        color: "bg-purple-500",
      },
      {
        stage: "Active Follow-ups",
        count: funnelFollowUp,
        percent: funnelTotalLeads > 0 ? Math.round((funnelFollowUp / funnelTotalLeads) * 100) : 0,
        color: "bg-amber-500",
      },
      {
        stage: "Enrolled & Paid Sales",
        count: funnelConverted,
        percent: funnelTotalLeads > 0 ? Math.round((funnelConverted / funnelTotalLeads) * 1000) / 10 : 0,
        color: "bg-emerald-500",
      },
    ];

    // =========================================================================
    // 3. COURSE REVENUE ATTRIBUTION (Using courseRangeParam)
    // =========================================================================
    const courseLeads = courseRangeParam === "all" ? allLeads : allLeads.filter((l) => new Date(l.createdAt) >= courseRange.startDate);
    const courseStatsMap: Record<string, { total: number; converted: number; revenue: number }> = {};
    let courseTotalRevenue = 0;

    courseLeads.forEach((l) => {
      const cName = l.course?.trim() || "General / Unspecified";
      if (!courseStatsMap[cName]) {
        courseStatsMap[cName] = { total: 0, converted: 0, revenue: 0 };
      }
      courseStatsMap[cName].total++;
      if (l.status === "CONVERTED") {
        const fee = getEstimatedCourseFee(l.course);
        courseTotalRevenue += fee;
        courseStatsMap[cName].converted++;
        courseStatsMap[cName].revenue += fee;
      }
    });

    const courseTotalLeadsCount = courseLeads.length > 0 ? courseLeads.length : 1;
    const courseDistribution = Object.entries(courseStatsMap)
      .map(([name, data]) => ({
        name,
        totalLeads: data.total,
        percentage: Math.round((data.total / courseTotalLeadsCount) * 100),
        conversions: data.converted,
        conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 1000) / 10 : 0,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.totalLeads - a.totalLeads);

    // =========================================================================
    // 4. COUNSELLOR PERFORMANCE (Using counsellorRangeParam)
    // =========================================================================
    const counsellorLeads = counsellorRangeParam === "all" ? allLeads : allLeads.filter((l) => new Date(l.createdAt) >= counsellorRange.startDate);
    const counsellorCalls = counsellorRangeParam === "all" ? allCallActivities : allCallActivities.filter((a) => new Date(a.createdAt) >= counsellorRange.startDate);

    const counsellorMetrics = counsellors.map((c) => {
      const cLeads = counsellorLeads.filter((l) => l.assignedToId === c.id);
      const cConverted = cLeads.filter((l) => l.status === "CONVERTED");
      const cNoAnswer = cLeads.filter((l) => l.status === "NO_ANSWER");
      const cCallsRange = counsellorCalls.filter((a) => a.userId === c.id).length;
      const cCallsTotal = allCallActivities.filter((a) => a.userId === c.id).length;

      const cRevenue = cConverted.reduce((sum, l) => sum + getEstimatedCourseFee(l.course), 0);
      const cConvRate = cLeads.length > 0 ? Math.round((cConverted.length / cLeads.length) * 1000) / 10 : 0;
      const cNoAnswerRate = cLeads.length > 0 ? Math.round((cNoAnswer.length / cLeads.length) * 1000) / 10 : 0;

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        totalLeads: cLeads.length,
        convertedLeads: cConverted.length,
        noAnswerLeads: cNoAnswer.length,
        activityCount: cCallsRange,
        totalCalls: cCallsTotal,
        revenue: cRevenue,
        conversionRate: cConvRate,
        noAnswerRate: cNoAnswerRate,
      };
    });

    return NextResponse.json({
      summary: {
        totalRevenue: globalRevenue,
        currentMonthRevenue: globalRevenue,
        salesGrowthRate: revenueDelta,
        totalLeads: totalLeadsCount,
        totalConverted: globalConvertedCount,
        totalConversionRate,
        totalCalls: globalCalls.length,
        recentCalls: globalCalls.length,
        totalWhatsApp: allWhatsAppCount,
        totalNoAnswer: globalNoAnswerCount,
        noAnswerRate: totalLeadsCount > 0 ? Math.round((globalNoAnswerCount / totalLeadsCount) * 1000) / 10 : 0,
        avgTicketSize,
        leadsDelta,
        callsDelta,
        admissionsDelta,
        revenueDelta,
        leadsSparkline,
        callsSparkline,
        admissionsSparkline,
        revenueSparkline,
        courseTotalRevenue,
      },
      dateRangeLabel,
      funnelRangeLabel: funnelRange.label,
      courseRangeLabel: courseRange.label,
      counsellorRangeLabel: counsellorRange.label,
      statusBreakdown: funnelStatusCounts,
      funnel: funnelStages,
      dailyTrends,
      courseDistribution,
      counsellors: counsellorMetrics,
    });
  } catch (error: any) {
    console.error("Fetch admin analytics error:", error);
    const statusCode = error.message === "UNAUTHORIZED" ? 401 : error.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics metrics" },
      { status: statusCode }
    );
  }
}
