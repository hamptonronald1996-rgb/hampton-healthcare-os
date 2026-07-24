import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Hampton Healthcare OS."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function authorize(req, supabase) {
  const token = String(req.headers.authorization || "").replace(
    /^Bearer\s+/i,
    ""
  );

  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  try {
    const supabase = getAdminClient();
    const user = await authorize(req, supabase);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .neq("type", "caregiver_application")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        submissions: data || [],
      });
    }

    if (req.method === "PATCH") {
      const { id, status } = req.body || {};

      if (!id || !status) {
        return res.status(400).json({
          error: "Submission id and status are required.",
        });
      }

      const allowedStatuses = [
        "care_request",
        "contacted",
        "scheduled",
        "converted",
        "rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid intake status." });
      }

      const { data, error } = await supabase
        .from("submissions")
        .update({ type: status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ submission: data });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Patient intake API error:", error);

    return res.status(500).json({
      error: error?.message || "Unable to access patient intakes.",
    });
  }
}
