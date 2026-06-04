"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Chip,
  Tooltip,
  Button
} from "@heroui/react";

const columns = [
  { id: "name", name: "NAME" },
  { id: "role", name: "ROLE" },
  { id: "status", name: "STATUS" },
  { id: "actions", name: "ACTIONS" },
];

const users = [
  {
    key: "1",
    id: 1,
    name: "Tony Reichert",
    role: "CEO",
    team: "Management",
    status: "active",
    age: "29",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    email: "tony.reichert@example.com",
  },
  {
    key: "2",
    id: 2,
    name: "Zoey Lang",
    role: "Technical Lead",
    team: "Development",
    status: "paused",
    age: "25",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    email: "zoey.lang@example.com",
  },
  {
    key: "3",
    id: 3,
    name: "Jane Fisher",
    role: "Senior Developer",
    team: "Development",
    status: "active",
    age: "22",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
    email: "jane.fisher@example.com",
  },
  {
    key: "4",
    id: 4,
    name: "William Howard",
    role: "Community Manager",
    team: "Marketing",
    status: "vacation",
    age: "28",
    avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
    email: "william.howard@example.com",
  },
];

const statusColorMap: Record<string, "success" | "danger" | "warning" | "default"> = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

import dynamic from 'next/dynamic';

const App = dynamic(() => Promise.resolve(AppContent), {
  ssr: false
});

function AppContent() {
  const renderCell = (user: any, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof typeof user];

    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <Avatar.Image src={user.avatar} />
            </Avatar>
            <div>
              <p className="font-bold text-sm">{cellValue}</p>
              <p className="text-sm text-default-400">{user.email}</p>
            </div>
          </div>
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{cellValue}</p>
            <p className="text-bold text-sm capitalize text-default-400">{user.team}</p>
          </div>
        );
      case "status":
        return (
          <Chip className="capitalize" color={statusColorMap[user.status]} size="sm" variant="soft">
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip>
              <Tooltip.Trigger>
                <Button isIconOnly size="sm" variant="ghost">
                  <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                    👁️
                  </span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Details</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger>
                <Button isIconOnly size="sm" variant="ghost">
                  <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                    ✏️
                  </span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Edit user</Tooltip.Content>
            </Tooltip>
            <Tooltip>
              <Tooltip.Trigger>
                <Button isIconOnly size="sm" variant="danger-soft">
                  <span className="text-lg text-danger cursor-pointer active:opacity-50">
                    🗑️
                  </span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content className="text-danger">Delete user</Tooltip.Content>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management (Admin)</h1>
        <Button variant="primary">Add New User</Button>
      </div>
      <Table aria-label="Example table with custom cells">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.id} className={column.id === "actions" ? "text-center" : "text-start"}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={users}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, (columnKey as any)?.id || columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default App;
