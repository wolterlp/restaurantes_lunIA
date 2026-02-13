import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose, IoMdAdd, IoMdTrash, IoMdCreate } from "react-icons/io";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { 
  addTable, updateTable, deleteTable, getTables,
  addCategory, updateCategory, deleteCategory, getAllCategories,
  addDish, updateDish, deleteDish,
  addInventoryMovement, getInventoryMovements,
  getSuppliers, addSupplier, updateSupplier, deleteSupplier
} from "../../https";
import { enqueueSnackbar } from "notistack";
import { popularDishes } from "../../constants";

const commonEmojis = [
  "🍔", "🍕", "🍟", "🌭", "🥓", "🌯", "🥙", "🥗", "🥘", "🥫", 
  "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🍤", "🍙", "🍚", 
  "🍘", "🍥", "🥠", "🍡", "🍧", "🍨", "🍦", "🥧", "🍰", "🎂", 
  "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🍺", "🍻", "🥂", 
  "🍷", "🥃", "🍸", "🍹", "🍾", "🍶", "🍵", "☕", "🍼", "🥄", 
  "🍴", "🍽️", "🥣", "🥡", "🥢", "🔥", "⭐", "❤️", "🏠", "💼"
];

const Modal = ({ activeModal, setActiveModal }) => {
  const queryClient = useQueryClient();
  const { role } = useSelector((state) => state.user);
  const [mode, setMode] = useState("list"); // list, create, edit
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Form States
  const [tableData, setTableData] = useState({ tableNo: "", seats: "" });
  const [categoryData, setCategoryData] = useState({ name: "", bgColor: "#000000", icon: "" });
  const [dishData, setDishData] = useState({ name: "", price: "", categoryId: "", image: "", stock: "", sku: "", barcode: "", unitCost: "", minThreshold: "", prepTime: 15 });
  const [movementData, setMovementData] = useState({ categoryId: "", itemId: "", type: "Ingreso", quantity: "", unitCost: "", supplierId: "", supplier: "", note: "" });
  const [supplierData, setSupplierData] = useState({ name: "", phone: "", email: "", address: "", notes: "", status: "Active" });
  const [showSupplierCreateForm, setShowSupplierCreateForm] = useState(false);

  // Reset states when modal changes
  useEffect(() => {
    setMode("list");
    setSelectedItem(null);
    setTableData({ tableNo: "", seats: "" });
    setCategoryData({ name: "", bgColor: "#000000", icon: "" });
    setDishData({ name: "", price: "", categoryId: "", image: "", stock: "", sku: "", barcode: "", unitCost: "", minThreshold: "", prepTime: 15 });
    setMovementData({ categoryId: "", itemId: "", type: "Ingreso", quantity: "", unitCost: "", supplierId: "", supplier: "", note: "" });
    setSupplierData({ name: "", phone: "", email: "", address: "", notes: "", status: "Active" });
    setShowSupplierCreateForm(false);
  }, [activeModal]);

  // Fetch Data
  const { data: categoriesRes } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
  });
  const categories = categoriesRes?.data || [];

  const { data: tablesRes } = useQuery({
    queryKey: ["tables"],
    queryFn: getTables,
    enabled: activeModal === "table",
  });
  const tables = tablesRes?.data?.data || [];
  const { data: movementsRes } = useQuery({
    queryKey: ["inventory", "movements"],
    queryFn: () => getInventoryMovements({ limit: 50 }),
    enabled: activeModal === "inventory",
  });
  const { data: suppliersRes } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
    enabled: activeModal === "suppliers" || activeModal === "inventory",
  });
  const suppliers = suppliersRes?.data?.data || [];

  // Mutations
  const onSuccess = (msg) => {
    enqueueSnackbar(msg, { variant: "success" });
    queryClient.invalidateQueries(["tables"]);
    queryClient.invalidateQueries(["categories"]);
    queryClient.invalidateQueries(["inventory", "movements"]);
    if (mode !== "list") setMode("list");
  };

  const onError = (err) => {
    enqueueSnackbar(err.response?.data?.message || "Algo salió mal", { variant: "error" });
  };

  // Table Mutations
  const addTableMutation = useMutation({ mutationFn: addTable, onSuccess: (res) => onSuccess(res.data.message), onError });
  const updateTableMutation = useMutation({ mutationFn: updateTable, onSuccess: (res) => onSuccess(res.data.message), onError });
  const deleteTableMutation = useMutation({ mutationFn: deleteTable, onSuccess: (res) => onSuccess(res.data.message), onError });

  // Category Mutations
  const addCategoryMutation = useMutation({ mutationFn: addCategory, onSuccess: (res) => onSuccess(res.data.message), onError });
  const updateCategoryMutation = useMutation({ mutationFn: updateCategory, onSuccess: (res) => onSuccess(res.data.message), onError });
  const deleteCategoryMutation = useMutation({ mutationFn: deleteCategory, onSuccess: (res) => onSuccess(res.data.message), onError });

  // Dish Mutations
  const addDishMutation = useMutation({ mutationFn: addDish, onSuccess: (res) => onSuccess(res.data.message), onError });
  const updateDishMutation = useMutation({ mutationFn: updateDish, onSuccess: (res) => onSuccess(res.data.message), onError });
  const deleteDishMutation = useMutation({ mutationFn: deleteDish, onSuccess: (res) => onSuccess(res.data.message), onError });
  const addMovementMutation = useMutation({ mutationFn: addInventoryMovement, onSuccess: (res) => onSuccess(res.data.message), onError });
  const addSupplierMutation = useMutation({ mutationFn: addSupplier, onSuccess: (res) => {
    onSuccess(res.data.message);
    const created = res?.data?.data;
    if (created?._id) {
      setMovementData((prev) => ({ ...prev, supplierId: created._id, supplier: created.name }));
      setShowSupplierCreateForm(false);
    }
    queryClient.invalidateQueries(["suppliers"]);
  }, onError });
  const updateSupplierMutation = useMutation({ mutationFn: updateSupplier, onSuccess: (res) => {
    onSuccess(res.data.message);
    queryClient.invalidateQueries(["suppliers"]);
  }, onError });
  const deleteSupplierMutation = useMutation({ mutationFn: deleteSupplier, onSuccess: (res) => {
    onSuccess(res.data.message);
    queryClient.invalidateQueries(["suppliers"]);
  }, onError });

  const handleCloseModal = () => setActiveModal(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeModal === "table") {
      if (mode === "create") addTableMutation.mutate(tableData);
      else if (mode === "edit") updateTableMutation.mutate({ tableId: selectedItem._id, ...tableData });
    } else if (activeModal === "category") {
      if (mode === "create") addCategoryMutation.mutate(categoryData);
      else if (mode === "edit") updateCategoryMutation.mutate({ categoryId: selectedItem._id, ...categoryData });
    } else if (activeModal === "dishes") {
      if (mode === "create") addDishMutation.mutate(dishData);
      else if (mode === "edit") updateDishMutation.mutate({ categoryId: selectedItem.categoryId, dishId: selectedItem._id, ...dishData });
    } else if (activeModal === "inventory") {
      if (mode === "create") addMovementMutation.mutate(movementData);
      else if (mode === "edit") updateDishMutation.mutate({ categoryId: selectedItem.categoryId, dishId: selectedItem._id, ...dishData });
    } else if (activeModal === "suppliers") {
      if (mode === "create") addSupplierMutation.mutate(supplierData);
      else if (mode === "edit") updateSupplierMutation.mutate({ id: selectedItem._id, ...supplierData });
    }
  };

  const handleEdit = (item, type) => {
    setSelectedItem(item);
    setMode("edit");
    if (type === "table") {
      setTableData({ tableNo: item.tableNo, seats: item.seats });
    } else if (type === "category") {
      setCategoryData({ name: item.name, bgColor: item.bgColor, icon: item.icon });
    } else if (type === "dish") {
      setDishData({ name: item.name, price: item.price, categoryId: item.categoryId, image: item.image || "", stock: item.stock ?? "", sku: item.sku ?? "", barcode: item.barcode ?? "", unitCost: item.unitCost ?? "", minThreshold: item.minThreshold ?? "", prepTime: item.prepTime ?? 15 });
    } else if (type === "invItem") {
      setDishData({ name: item.name, price: item.price, categoryId: item.categoryId, image: item.image || "", stock: item.stock ?? "", sku: item.sku ?? "", barcode: item.barcode ?? "", unitCost: item.unitCost ?? "", minThreshold: item.minThreshold ?? "" });
    } else if (type === "supplier") {
      setSupplierData({ name: item.name, phone: item.phone || "", email: item.email || "", address: item.address || "", notes: item.notes || "", status: item.status || "Active" });
    }
  };

  const handleDelete = (item, type) => {
    if(!window.confirm("¿Estás seguro de que quieres eliminar este ítem?")) return;
    
    if (type === "table") deleteTableMutation.mutate(item._id);
    else if (type === "category") deleteCategoryMutation.mutate(item._id);
    else if (type === "dish") deleteDishMutation.mutate({ categoryId: item.categoryId, dishId: item._id });
    else if (type === "supplier") deleteSupplierMutation.mutate(item._id);
  };
  const handleMovementOpen = (item) => {
    setSelectedItem(item);
    setMode("create");
    setMovementData({ categoryId: item.categoryId, itemId: item._id, type: "Ingreso", quantity: "", unitCost: item.unitCost ?? "", supplierId: "", supplier: "", note: "" });
  };

  const getTitle = () => {
    if (activeModal === "inventory") {
      if (mode === "list") return "Gestionar Inventario";
      return mode === "create" ? "Movimiento de Inventario" : "Editar Inventario";
    }
    if (activeModal === "suppliers") {
      if (mode === "list") return "Gestionar Proveedores";
      return mode === "create" ? "Agregar Proveedor" : "Editar Proveedor";
    }
    if (mode === "list") return `Gestionar ${activeModal === "dishes" ? "Platillos" : activeModal === "table" ? "Mesas" : "Categorías"}`;
    return `${mode === "create" ? "Agregar" : "Editar"} ${activeModal === "dishes" ? "Platillo" : activeModal === "table" ? "Mesa" : "Categoría"}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-[600px] max-h-[80vh] flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">{getTitle()}</h2>
          <button onClick={handleCloseModal} className="text-[#f5f5f5] hover:text-red-500">
            <IoMdClose size={24} />
          </button>
        </div>

        {/* LIST MODE */}
        {mode === "list" && (
          <div className="flex-1 overflow-y-auto">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => {
                    setMode("create");
                    setTableData({ tableNo: "", seats: "" });
                    setCategoryData({ name: "", bgColor: "#000000", icon: "" });
                    setDishData({ name: "", price: "", categoryId: "", image: "", stock: "", sku: "", barcode: "", unitCost: "", minThreshold: "", prepTime: 15 });
                    if (activeModal === "suppliers") {
                      setSupplierData({ name: "", phone: "", email: "", address: "", notes: "", status: "Active" });
                    }
                }} 
                className="bg-[#f6b100] text-[#f5f5f5] px-4 py-2 rounded-lg flex items-center gap-2 font-semibold"
              >
                <IoMdAdd /> Agregar Nuevo
              </button>
            </div>

            <div className="space-y-2">
              {activeModal === "table" && tables.map((table) => (
                <div key={table._id} className="bg-[#1f1f1f] p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="text-[#f5f5f5] font-semibold">Mesa {table.tableNo}</h3>
                    <p className="text-[#ababab] text-sm">{table.seats} Asientos</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(table, "table")} className="text-blue-500 p-2 hover:bg-[#262626] rounded"><IoMdCreate size={20} /></button>
                    <button onClick={() => handleDelete(table, "table")} className="text-red-500 p-2 hover:bg-[#262626] rounded"><IoMdTrash size={20} /></button>
                  </div>
                </div>
              ))}

              {activeModal === "category" && categories.map((cat) => (
                <div key={cat._id} className="bg-[#1f1f1f] p-4 rounded-lg flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <h3 className="text-[#f5f5f5] font-semibold">{cat.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(cat, "category")} className="text-blue-500 p-2 hover:bg-[#262626] rounded"><IoMdCreate size={20} /></button>
                    <button onClick={() => handleDelete(cat, "category")} className="text-red-500 p-2 hover:bg-[#262626] rounded"><IoMdTrash size={20} /></button>
                  </div>
                </div>
              ))}

              {activeModal === "dishes" && categories.map((cat) => (
                <div key={cat._id} className="mb-4">
                  <h3 className="text-[#ababab] text-sm font-semibold mb-2 ml-1">{cat.name}</h3>
                  {(cat.items || []).length === 0 && <p className="text-[#666] text-xs ml-1 italic">No hay platillos</p>}
                  {(cat.items || []).map((dish) => (
                    <div key={dish._id} className="bg-[#1f1f1f] p-3 rounded-lg flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                         {dish.image ? (
                             <img src={dish.image} alt={dish.name} className="w-[40px] h-[40px] rounded-full object-cover" />
                         ) : (
                             <div className="w-[40px] h-[40px] rounded-full bg-[#333] flex items-center justify-center text-xs text-[#ababab]">Img</div>
                         )}
                         <div>
                            <h4 className="text-[#f5f5f5] font-medium">{dish.name}</h4>
                            <p className="text-[#ababab] text-xs">${dish.price}</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit({ ...dish, categoryId: cat._id }, "dish")} className="text-blue-500 p-2 hover:bg-[#262626] rounded"><IoMdCreate size={18} /></button>
                        <button onClick={() => handleDelete({ ...dish, categoryId: cat._id }, "dish")} className="text-red-500 p-2 hover:bg-[#262626] rounded"><IoMdTrash size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {activeModal === "inventory" && categories.map((cat) => (
                <div key={cat._id} className="mb-4">
                  <h3 className="text-[#ababab] text-sm font-semibold mb-2 ml-1">{cat.name}</h3>
                  {(cat.items || []).filter(i => (i.prepTime ?? 15) === 0).length === 0 && <p className="text-[#666] text-xs ml-1 italic">No hay productos sin preparación</p>}
                  {(cat.items || []).filter(i => (i.prepTime ?? 15) === 0).map((dish) => (
                    <div key={dish._id} className="bg-[#1f1f1f] p-3 rounded-lg flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-[40px] h-[40px] rounded-full bg-[#333] flex items-center justify-center text-xs text-[#ababab]">{dish.image ? <img src={dish.image} alt={dish.name} className="w-full h-full object-cover rounded-full" /> : "Prod"}</div>
                        <div>
                          <h4 className="text-[#f5f5f5] font-medium">{dish.name}</h4>
                          <p className="text-[#ababab] text-xs">Stock: {dish.stock ?? 0}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit({ ...dish, categoryId: cat._id }, "invItem")} className="text-blue-500 p-2 hover:bg-[#262626] rounded"><IoMdCreate size={18} /></button>
                        <button onClick={() => handleMovementOpen({ ...dish, categoryId: cat._id })} className="text-[#f6b100] p-2 hover:bg-[#262626] rounded"><IoMdAdd size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {activeModal === "suppliers" && (suppliers || []).map((s) => (
                <div key={s._id} className="bg-[#1f1f1f] p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <h3 className="text-[#f5f5f5] font-semibold">{s.name}</h3>
                    <p className="text-[#ababab] text-xs">{[s.phone, s.email].filter(Boolean).join(" • ")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(s, "supplier")} className="text-blue-500 p-2 hover:bg-[#262626] rounded"><IoMdCreate size={20} /></button>
                    <button onClick={() => handleDelete(s, "supplier")} className="text-red-500 p-2 hover:bg-[#262626] rounded"><IoMdTrash size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CREATE/EDIT FORM */}
        {mode !== "list" && (
          <>
          <form id="modal-form" onSubmit={handleSubmit} className="space-y-4 mt-4 overflow-y-auto flex-1 pr-2">
            {activeModal === "table" && (
              <>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Número de Mesa</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      min="0"
                      value={tableData.tableNo}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                            setTableData({ ...tableData, tableNo: val });
                        }
                      }}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Asientos</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      min="0"
                      value={tableData.seats}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                            setTableData({ ...tableData, seats: val });
                        }
                      }}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {activeModal === "category" && (
              <>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Nombre de la Categoría</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="text"
                      value={categoryData.name}
                      onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Ícono (Emoji)</label>
                  <div className="relative">
                    <div 
                        className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <span className="text-white text-xl mr-2">{categoryData.icon || "🔍"}</span>
                        <input
                            type="text"
                            value={categoryData.icon}
                            readOnly
                            className="bg-transparent flex-1 text-white focus:outline-none cursor-pointer"
                            placeholder="Seleccionar emoji"
                            required
                        />
                    </div>
                    
                    {showEmojiPicker && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-[#262626] border border-[#333] rounded-lg shadow-xl z-50 p-2 grid grid-cols-8 gap-2 h-48 overflow-y-auto scrollbar-hide">
                            {commonEmojis.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                        setCategoryData({ ...categoryData, icon: emoji });
                                        setShowEmojiPicker(false);
                                    }}
                                    className="text-2xl hover:bg-[#333] p-1 rounded transition-colors flex items-center justify-center"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Color de Fondo</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="color"
                      value={categoryData.bgColor}
                      onChange={(e) => setCategoryData({ ...categoryData, bgColor: e.target.value })}
                      className="bg-transparent flex-1 h-8 cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {activeModal === "dishes" && (
              <>
                 <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Seleccionar Categoría</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <select
                      value={dishData.categoryId}
                      onChange={(e) => setDishData({ ...dishData, categoryId: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none [&>option]:text-black"
                      required
                      disabled={mode === "edit"} // Disable category change on edit to simplify backend logic
                    >
                      <option value="">Seleccionar Categoría</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Imagen</label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {popularDishes.map((dish) => (
                      <div 
                        key={dish.id} 
                        onClick={() => setDishData({ ...dishData, image: dish.image })}
                        className={`cursor-pointer rounded-full overflow-hidden border-2 w-10 h-10 ${dishData.image === dish.image ? 'border-[#f6b100]' : 'border-transparent'}`}
                      >
                        <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="text"
                      placeholder="O pegar URL de imagen..."
                      value={dishData.image}
                      onChange={(e) => setDishData({ ...dishData, image: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Nombre del Platillo</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="text"
                      value={dishData.name}
                      onChange={(e) => setDishData({ ...dishData, name: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Precio</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      min="0"
                      value={dishData.price}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                            setDishData({ ...dishData, price: val });
                        }
                      }}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg p-3 px-4 bg-[#1f1f1f]">
                  <span className="text-[#ababab] text-sm font-medium">No requiere preparación</span>
                  <input
                    type="checkbox"
                    checked={(dishData.prepTime ?? 15) === 0}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setDishData({ ...dishData, prepTime: checked ? 0 : 15 });
                    }}
                    className="w-5 h-5 accent-[#f6b100]"
                  />
                </div>
              </>
            )}

            {activeModal === "inventory" && mode === "edit" && (
              <>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Stock</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      min="0"
                      value={dishData.stock}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                          setDishData({ ...dishData, stock: val });
                        }
                      }}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">SKU</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="text"
                      value={dishData.sku}
                      onChange={(e) => setDishData({ ...dishData, sku: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Código de barras</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="text"
                      value={dishData.barcode}
                      onChange={(e) => setDishData({ ...dishData, barcode: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Costo unitario</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      min="0"
                      value={dishData.unitCost}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                          setDishData({ ...dishData, unitCost: val });
                        }
                      }}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Stock mínimo</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      min="0"
                      value={dishData.minThreshold}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                          setDishData({ ...dishData, minThreshold: val });
                        }
                      }}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {activeModal === "inventory" && mode === "create" && (
              <>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Tipo de movimiento</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <select
                      value={movementData.type}
                      onChange={(e) => setMovementData({ ...movementData, type: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none [&>option]:text-black"
                      required
                    >
                      <option value="Ingreso">Ingreso</option>
                      <option value="Salida">Salida</option>
                      <option value="Ajuste">Ajuste</option>
                      <option value="Merma">Merma</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Cantidad</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      min="0"
                      value={movementData.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                          setMovementData({ ...movementData, quantity: val });
                        }
                      }}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Costo unitario</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="number"
                      min="0"
                      value={movementData.unitCost}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                          setMovementData({ ...movementData, unitCost: val });
                        }
                      }}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Proveedor</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f] gap-2">
                    <select
                      value={movementData.supplierId}
                      onChange={(e) => {
                        const id = e.target.value;
                        const found = suppliers.find(s => s._id === id);
                        setMovementData({ ...movementData, supplierId: id, supplier: found?.name || "" });
                        setShowSupplierCreateForm(false);
                      }}
                      className="bg-transparent flex-1 text-white focus:outline-none [&>option]:text-black"
                    >
                      <option value="">Seleccionar proveedor</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    {role === "Admin" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!showSupplierCreateForm) {
                          setShowSupplierCreateForm(true);
                          return;
                        }
                        if (!supplierData.name) {
                          enqueueSnackbar("Ingrese nombre del proveedor", { variant: "warning" });
                          return;
                        }
                        addSupplierMutation.mutate(supplierData);
                      }}
                      className="bg-[#f6b100] text-[#1f1f1f] px-3 py-2 rounded font-bold"
                    >
                      Crear proveedor
                    </button>
                    )}
                  </div>
                  {showSupplierCreateForm && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={supplierData.name}
                        onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
                        className="bg-[#1f1f1f] text-white p-2 rounded outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Teléfono"
                        value={supplierData.phone}
                        onChange={(e) => setSupplierData({ ...supplierData, phone: e.target.value })}
                        className="bg-[#1f1f1f] text-white p-2 rounded outline-none"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={supplierData.email}
                        onChange={(e) => setSupplierData({ ...supplierData, email: e.target.value })}
                        className="bg-[#1f1f1f] text-white p-2 rounded outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Dirección"
                        value={supplierData.address}
                        onChange={(e) => setSupplierData({ ...supplierData, address: e.target.value })}
                        className="bg-[#1f1f1f] text-white p-2 rounded outline-none"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Nota</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="text"
                      value={movementData.note}
                      onChange={(e) => setMovementData({ ...movementData, note: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {activeModal === "suppliers" && (
              <>
                <div>
                  <label className="block text-[#ababab] mb-2 text-sm font-medium">Nombre</label>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="text"
                      value={supplierData.name}
                      onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={supplierData.phone}
                      onChange={(e) => setSupplierData({ ...supplierData, phone: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                    <input
                      type="email"
                      placeholder="Email"
                      value={supplierData.email}
                      onChange={(e) => setSupplierData({ ...supplierData, email: e.target.value })}
                      className="bg-transparent flex-1 text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                  <input
                    type="text"
                    placeholder="Dirección"
                    value={supplierData.address}
                    onChange={(e) => setSupplierData({ ...supplierData, address: e.target.value })}
                    className="bg-transparent flex-1 text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center rounded-lg p-3 px-4 bg-[#1f1f1f]">
                  <input
                    type="text"
                    placeholder="Notas"
                    value={supplierData.notes}
                    onChange={(e) => setSupplierData({ ...supplierData, notes: e.target.value })}
                    className="bg-transparent flex-1 text-white focus:outline-none"
                  />
                </div>
              </>
            )}

          </form>
            <div className="flex gap-4 pt-4 mt-2 border-t border-[#333]">
              <button
                type="button"
                onClick={() => setMode("list")}
                className="flex-1 bg-transparent border border-[#ababab] text-[#f5f5f5] py-3 rounded-lg font-semibold hover:bg-[#333]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="modal-form"
                className="flex-1 bg-[#f6b100] text-[#1f1f1f] py-3 rounded-lg font-bold hover:bg-[#e5a500]"
              >
                {mode === "create" ? "Agregar" : "Actualizar"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Modal;
