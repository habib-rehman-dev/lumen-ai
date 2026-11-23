import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
    const backendUrl = process.env.BACKEND_URL;

    try {
        const response = await axios.get(`${backendUrl}/api/v1`);

        if (response.status !== 200) {
            return NextResponse.json({ error: "Failed to fetch data" }, { status: response.status });
        }
        if (!response.data) {
            return NextResponse.json({ error: "No data received" }, { status: 500 });
        }
        if (response.data) {

            return NextResponse.json(response.data);
        }
    }
    catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
