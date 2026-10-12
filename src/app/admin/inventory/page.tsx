"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Package,
  Boxes,
  Pencil,
  Archive,
  RotateCcw,
  RefreshCw,
  X,
  Search,
  AlertTriangle,
  CheckCircle2,
  Ban,
} from "lucide-react";

import {
  EquipmentInventory,
  InventoryStatus,
  getEquipmentInventory,
  addEquipmentInventory,
  updateEquipmentInventory,
  getInventoryStatus,
} from "@/lib/inventoryService";
import { archiveRecord, restoreRecord } from "@/lib/archiveService";
import { logActivity } from "@/lib/activityLog";

type FormData = {
  name: string;
  category: string;
  totalQuantity: string;
  unit: string;
  description: string;
};

const emptyForm: FormData = {
  name: "",
  category: "",
  totalQuantity: "",
  unit: "pcs",
  description: "",
};

export default function EquipmentInventoryPage() {
  const [inventory, setInventory] = useState<EquipmentInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] =
    useState<EquipmentInventory | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);

      const data = await getEquipmentInventory();
      setInventory(data);
    } catch (error) {
      console.error("Error loading equipment inventory:", error);
      alert("Failed to load equipment inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => loadInventory());
  }, []);

  const openAddForm = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (item: EquipmentInventory) => {
    setEditingItem(item);

    setForm({
      name: item.name,
      category: item.category,
      totalQuantity: String(item.totalQuantity),
      unit: item.unit,
      description: item.description || "",
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const category = form.category.trim();
    const unit = form.unit.trim();
    const description = form.description.trim();
    const totalQuantity = Number(form.totalQuantity);

    if (!name) {
      alert("Please enter the equipment name.");
      return;
    }

    if (!category) {
      alert("Please enter the category.");
      return;
    }

    if (!unit) {
      alert("Please enter the unit.");
      return;
    }

    if (!Number.isInteger(totalQuantity) || totalQuantity <= 0) {
      alert("Total quantity must be a whole number greater than 0.");
      return;
    }

    try {
      setSaving(true);

      if (editingItem) {
        /*
         * When editing an existing item, do not allow the new total
         * quantity to become lower than the number currently borrowed,
         * damaged, or lost.
         */
        const minimumRequired =
          editingItem.borrowedQuantity +
          editingItem.damagedQuantity +
          editingItem.lostQuantity;

        if (totalQuantity < minimumRequired) {
          alert(
            `Total quantity cannot be less than ${minimumRequired} because some units are currently borrowed, damaged, or lost.`
          );
          return;
        }

        const newAvailableQuantity =
          totalQuantity -
          editingItem.borrowedQuantity -
          editingItem.damagedQuantity -
          editingItem.lostQuantity;

        await updateEquipmentInventory(editingItem.id, {
          name,
          category,
          totalQuantity,
          availableQuantity: newAvailableQuantity,
          unit,
          description,
          status: getInventoryStatus(
            newAvailableQuantity,
            totalQuantity
          ),
        });

        alert("Equipment inventory updated successfully.");
      } else {
        await addEquipmentInventory({
          name,
          category,
          totalQuantity,
          availableQuantity: totalQuantity,
          borrowedQuantity: 0,
          damagedQuantity: 0,
          lostQuantity: 0,
          unit,
          description,
          status: getInventoryStatus(totalQuantity, totalQuantity),
        });

        alert("Equipment added to inventory successfully.");
      }

      closeForm();
      await loadInventory();
    } catch (error) {
      console.error("Error saving equipment:", error);
      alert("Failed to save equipment inventory.");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (item: EquipmentInventory) => {
    const hasActiveUnits =
      item.borrowedQuantity > 0 ||
      item.damagedQuantity > 0 ||
      item.lostQuantity > 0;

    if (hasActiveUnits) {
      alert(
        "This equipment cannot be archived while it has borrowed, damaged, or lost units."
      );
      return;
    }

    const confirmed = window.confirm(
      `Archive "${item.name}"? This record will be removed from the active list but will not be permanently deleted.`
    );

    if (!confirmed) return;

    try {
      await archiveRecord("equipmentInventory", item.id);
      await logActivity({
        action: "EQUIPMENT_ARCHIVED",
        category: "Equipment",
        description: `Administrator archived equipment ${item.name}.`,
        actorType: "admin",
        referenceId: item.id,
        referenceType: "asset",
      });

      alert("Record archived successfully.");

      await loadInventory();
    } catch (error) {
      console.error("Error deleting equipment:", error);
      alert("Failed to delete equipment.");
    }
  };

  const handleRestore = async (item: EquipmentInventory) => {
    if (!window.confirm(`Restore "${item.name}" to active equipment?`)) return;

    try {
      await restoreRecord("equipmentInventory", item.id);
      await logActivity({
        action: "EQUIPMENT_RESTORED",
        category: "Equipment",
        description: `Administrator restored equipment ${item.name}.`,
        actorType: "admin",
        referenceId: item.id,
        referenceType: "asset",
      });
      alert("Record restored successfully.");
      await loadInventory();
    } catch (error) {
      console.error("Error restoring equipment:", error);
      alert("Failed to restore equipment.");
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const search = searchTerm.toLowerCase();

    return (
      (showArchived ? item.archived === true : item.archived !== true) &&
      (item.name.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      item.unit.toLowerCase().includes(search))
    );
  });

  const totalEquipmentTypes = inventory.length;

  const totalUnits = inventory.reduce(
    (sum, item) => sum + item.totalQuantity,
    0
  );

  const totalAvailable = inventory.reduce(
    (sum, item) => sum + item.availableQuantity,
    0
  );

  const totalBorrowed = inventory.reduce(
    (sum, item) => sum + item.borrowedQuantity,
    0
  );

  const totalDamaged = inventory.reduce(
    (sum, item) => sum + item.damagedQuantity,
    0
  );

  const getStatusStyle = (status: InventoryStatus) => {
    switch (status) {
      case "Available":
        return {
          className:
            "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };

      case "Low Stock":
        return {
          className:
            "bg-amber-50 text-amber-700 border-amber-200",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };

      case "Out of Stock":
        return {
          className: "bg-red-50 text-red-700 border-red-200",
          icon: <Ban className="w-3.5 h-3.5" />,
        };

      case "Unavailable":
        return {
          className:
            "bg-slate-100 text-slate-600 border-slate-200",
          icon: <Ban className="w-3.5 h-3.5" />,
        };

      default:
        return {
          className:
            "bg-slate-100 text-slate-600 border-slate-200",
          icon: null,
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FC]">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 py-5">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 transition hover:text-violet-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#F0EAFF] flex items-center justify-center">
                  <Boxes className="w-6 h-6 text-[#6D3FE7]" />
                </div>

                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#17213A]">
                    Equipment Inventory
                  </h1>

                  <p className="text-sm text-slate-500 mt-0.5">
                    Manage available barangay equipment and stock levels.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
              <div className="flex w-full flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto">
                <button type="button" onClick={() => setShowArchived(false)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${!showArchived ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>
                  Active Equipment
                </button>
                <button type="button" onClick={() => setShowArchived(true)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${showArchived ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>
                  Archived Equipment
                </button>
              </div>

              <button
                type="button"
                onClick={loadInventory}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#6D3FE7] text-white text-sm font-bold hover:bg-[#5B32C7] transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Equipment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <SummaryCard
            title="Equipment Types"
            value={totalEquipmentTypes}
            icon={<Boxes className="w-5 h-5" />}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />

          <SummaryCard
            title="Total Units"
            value={totalUnits}
            icon={<Package className="w-5 h-5" />}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />

          <SummaryCard
            title="Available"
            value={totalAvailable}
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />

          <SummaryCard
            title="Borrowed"
            value={totalBorrowed}
            icon={<Package className="w-5 h-5" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />

          <SummaryCard
            title="Damaged"
            value={totalDamaged}
            icon={<AlertTriangle className="w-5 h-5" />}
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
        </div>

        {/* INVENTORY CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* TABLE HEADER */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                  <h2 className="text-base font-extrabold text-[#17213A]">
                  {showArchived ? "Archived Equipment" : "Available Equipment"}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Track equipment stock, borrowed units, and item condition.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search equipment..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#6D3FE7]/20 focus:border-[#6D3FE7]"
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-7 h-7 text-[#6D3FE7] animate-spin mx-auto mb-3" />

                <p className="text-sm font-semibold text-slate-600">
                  Loading equipment inventory...
                </p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="py-16 text-center px-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0EAFF] flex items-center justify-center mb-4">
                  <Boxes className="w-7 h-7 text-[#6D3FE7]" />
                </div>

                <h3 className="text-base font-bold text-[#17213A]">
                  {searchTerm
                    ? "No equipment found"
                    : showArchived
                    ? "No archived equipment"
                    : "No equipment in inventory"}
                </h3>

                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  {searchTerm
                    ? "Try searching using another equipment name or category."
                    : showArchived
                    ? "Archived equipment will remain available here for restoration."
                    : "Add the barangay's equipment so residents can see what is available for borrowing."}
                </p>

                {!searchTerm && !showArchived && (
                  <button
                    type="button"
                    onClick={openAddForm}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6D3FE7] text-white text-sm font-bold hover:bg-[#5B32C7]"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Equipment
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Equipment
                    </th>

                    <th className="text-left px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Category
                    </th>

                    <th className="text-center px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Total
                    </th>

                    <th className="text-center px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Available
                    </th>

                    <th className="text-center px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Borrowed
                    </th>

                    <th className="text-center px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Damaged
                    </th>

                    <th className="text-center px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Lost
                    </th>

                    <th className="text-center px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="text-right px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((item) => {
                    const statusStyle = getStatusStyle(item.status);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        {/* EQUIPMENT */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F0EAFF] flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-[#6D3FE7]" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#17213A] truncate max-w-[220px]">
                                {item.name}
                              </p>

                              {item.description && (
                                <p className="text-xs text-slate-500 truncate max-w-[220px] mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-600">
                            {item.category}
                          </span>
                        </td>

                        {/* TOTAL */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-bold text-[#17213A]">
                            {item.totalQuantity}
                          </span>

                          <span className="text-xs text-slate-400 ml-1">
                            {item.unit}
                          </span>
                        </td>

                        {/* AVAILABLE */}
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`text-sm font-extrabold ${
                              item.availableQuantity === 0
                                ? "text-red-600"
                                : item.availableQuantity <=
                                  Math.max(
                                    1,
                                    Math.ceil(
                                      item.totalQuantity * 0.2
                                    )
                                  )
                                ? "text-amber-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {item.availableQuantity}
                          </span>
                        </td>

                        {/* BORROWED */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-amber-600">
                            {item.borrowedQuantity}
                          </span>
                        </td>

                        {/* DAMAGED */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-red-600">
                            {item.damagedQuantity}
                          </span>
                        </td>

                        {/* LOST */}
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-slate-600">
                            {item.lostQuantity}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold ${statusStyle.className}`}
                          >
                            {statusStyle.icon}
                            {item.status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(item)}
                              className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#6D3FE7] hover:bg-[#F8F5FF] hover:border-[#D9CCFF] flex items-center justify-center transition"
                              title="Edit equipment"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => showArchived ? handleRestore(item) : handleArchive(item)}
                              className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition"
                              title={showArchived ? "Restore equipment" : "Archive equipment"}
                            >
                              {showArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* FOOTER */}
          {!loading && filteredInventory.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-700">
                  {filteredInventory.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-700">
                  {inventory.length}
                </span>{" "}
                equipment types
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeForm}
          />

          <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0EAFF] flex items-center justify-center">
                  <Boxes className="w-5 h-5 text-[#6D3FE7]" />
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-[#17213A]">
                    {editingItem
                      ? "Edit Equipment"
                      : "Add Equipment"}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {editingItem
                      ? "Update equipment inventory information."
                      : "Add a new equipment item to the inventory."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* NAME */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Equipment Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Monoblock Chairs"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-[#6D3FE7] focus:ring-2 focus:ring-[#6D3FE7]/15"
                  />
                </div>

                {/* CATEGORY */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Category
                  </label>

                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    placeholder="e.g. Furniture"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-[#6D3FE7] focus:ring-2 focus:ring-[#6D3FE7]/15"
                  />
                </div>

                {/* QUANTITY + UNIT */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Total Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.totalQuantity}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          totalQuantity: e.target.value,
                        }))
                      }
                      placeholder="e.g. 100"
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-[#6D3FE7] focus:ring-2 focus:ring-[#6D3FE7]/15"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Unit
                    </label>

                    <select
                      value={form.unit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          unit: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-[#6D3FE7] focus:ring-2 focus:ring-[#6D3FE7]/15"
                    >
                      <option value="pcs">pcs</option>
                      <option value="sets">sets</option>
                      <option value="units">units</option>
                      <option value="pieces">pieces</option>
                    </select>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Description
                    <span className="font-normal text-slate-400 ml-1">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Add notes about this equipment..."
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none resize-none focus:border-[#6D3FE7] focus:ring-2 focus:ring-[#6D3FE7]/15"
                  />
                </div>

                {/* EDIT INFO */}
                {editingItem && (
                  <div className="rounded-xl bg-[#F8F5FF] border border-[#E5DCFF] p-4">
                    <p className="text-xs font-bold text-[#6D3FE7] mb-2">
                      Current Inventory
                    </p>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">
                          Available
                        </p>
                        <p className="font-extrabold text-emerald-600 mt-0.5">
                          {editingItem.availableQuantity}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Borrowed
                        </p>
                        <p className="font-extrabold text-amber-600 mt-0.5">
                          {editingItem.borrowedQuantity}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-500">
                          Damaged
                        </p>
                        <p className="font-extrabold text-red-600 mt-0.5">
                          {editingItem.damagedQuantity}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL FOOTER */}
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#6D3FE7] text-white text-sm font-bold hover:bg-[#5B32C7] transition disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {saving && (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  )}

                  {editingItem
                    ? "Save Changes"
                    : "Add Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {title}
          </p>

          <p className="text-2xl font-extrabold text-[#17213A] mt-1">
            {value}
          </p>
        </div>

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
