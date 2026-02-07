import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IoMdClose, IoMdAdd, IoMdTrash, IoMdCreate } from "react-icons/io";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  addTable, updateTable, deleteTable, getTables,
  addCategory, updateCategory, deleteCategory, getAllCategories,
  addDish, updateDish, deleteDish 
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
  const [mode, setMode] = useState("list"); // list, create, edit
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Form States
  const [tableData, setTableData] = useState({ tableNo: "", seats: "" });
  const [categoryData, setCategoryData] = useState({ name: "", bgColor: "#000000", icon: "" });
  const [dishData, setDishData] = useState({ name: "", price: "", categoryId: "", image: "" });

  // Reset states when modal changes
  useEffect(() => {
    setMode("list");
    setSelectedItem(null);
    setTableData({ tableNo: "", seats: "" });
    setCategoryData({ name: "", bgColor: "#000000", icon: "" });
    setDishData({ name: "", price: "", categoryId: "", image: "" });
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

  // Mutations
  const onSuccess = (msg) => {
    enqueueSnackbar(msg, { variant: "success" });
    queryClient.invalidateQueries(["tables"]);
    queryClient.invalidateQueries(["categories"]);
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
      // Find category for this dish to pre-fill categoryId if needed, though usually embedded
      // For editing dish, we need categoryId. I'll pass it in `item` when mapping.
      setDishData({ name: item.name, price: item.price, categoryId: item.categoryId, image: item.image || "" });
    }
  };

  const handleDelete = (item, type) => {
    if(!window.confirm("¿Estás seguro de que quieres eliminar este ítem?")) return;
    
    if (type === "table") deleteTableMutation.mutate(item._id);
    else if (type === "category") deleteCategoryMutation.mutate(item._id);
    else if (type === "dish") deleteDishMutation.mutate({ categoryId: item.categoryId, dishId: item._id });
  };

  const getTitle = () => {
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
                    setDishData({ name: "", price: "", categoryId: "", image: "" });
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
