import { TableManager } from "@/components/settings/TableManager";
import { getSession } from "@/lib/auth/get-session";
import { connectToDatabase } from "@/lib/db/connect";
import { Table } from "@/models";

type TableRow = {
  id: string;
  number: string;
  label: string;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  section: string;
};

export default async function TablesSettingsPage() {
  const session = await getSession();
  await connectToDatabase();
  const tables = await Table.find({ restaurantId: session.restaurantId }).sort({ number: 1 }).lean();

  const serialized: TableRow[] = tables.map((table) => ({
    id: String(table._id),
    number: table.number,
    label: table.label ?? "",
    capacity: Number(table.capacity ?? 4),
    status: table.status,
    section: table.section ?? ""
  }));

  return <TableManager initialTables={serialized} />;
}
