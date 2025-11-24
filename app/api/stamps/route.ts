import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/stamps - Get all stamps for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    let query = supabase.from("stamps").select("*").eq("user_id", user.id);

    if (date) {
      query = query.eq("earned_date", date);
    }

    const { data: stamps, error } = await query.order("earned_date", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching stamps:", error);
      return NextResponse.json(
        { error: "Failed to fetch stamps" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stamps });
  } catch (error) {
    console.error("Error in GET /api/stamps:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/stamps - Create a new stamp for the current user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { earned_date, total_minutes } = body;

    if (!earned_date || !total_minutes) {
      return NextResponse.json(
        { error: "earned_date and total_minutes are required" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(earned_date)) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Validate total_minutes is a positive number
    if (typeof total_minutes !== "number" || total_minutes < 0) {
      return NextResponse.json(
        { error: "total_minutes must be a positive number" },
        { status: 400 }
      );
    }

    // Check if stamp already exists for this date
    const { data: existingStamps } = await supabase
      .from("stamps")
      .select("stamp_id")
      .eq("user_id", user.id)
      .eq("earned_date", earned_date)
      .limit(1);

    const existingStamp =
      existingStamps && existingStamps.length > 0 ? existingStamps[0] : null;

    let stamp;
    let error;

    if (existingStamp) {
      // Update existing stamp
      const result = await supabase
        .from("stamps")
        .update({ total_minutes })
        .eq("user_id", user.id)
        .eq("earned_date", earned_date)
        .select()
        .single();
      stamp = result.data;
      error = result.error;
    } else {
      // Insert new stamp
      const result = await supabase
        .from("stamps")
        .insert({
          user_id: user.id,
          earned_date,
          total_minutes,
        })
        .select()
        .single();
      stamp = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error creating/updating stamp:", error);
      return NextResponse.json(
        { error: "Failed to create stamp" },
        { status: 500 }
      );
    }

    return NextResponse.json({ stamp }, { status: existingStamp ? 200 : 201 });
  } catch (error) {
    console.error("Error in POST /api/stamps:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/stamps - Delete all stamps for the current user (reset)
export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("stamps")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting stamps:", error);
      return NextResponse.json(
        { error: "Failed to delete stamps" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/stamps:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
