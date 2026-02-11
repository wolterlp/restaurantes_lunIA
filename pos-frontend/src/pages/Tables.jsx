import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import TableCard from "../components/tables/TableCard";
import { tables } from "../constants";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTables } from "../https";
import { useSnackbar } from "notistack";

const Tables = () => {
  const [status, setStatus] = useState("all");
  const [headerSearchFilter, setHeaderSearchFilter] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
      document.title = "POS | Mesas"
    }, [])

    // Listen for search filter from header
    useEffect(() => {
      const handleSearchFilter = () => {
        const filter = localStorage.getItem('searchFilter');
        if (filter) {
          const parsedFilter = JSON.parse(filter);
          if (parsedFilter.type === 'table') {
            setHeaderSearchFilter(parsedFilter);
            // Auto-focus on the table after navigation
            setTimeout(() => {
              const tableElement = document.getElementById(`table-${parsedFilter.value}`);
              if (tableElement) {
                tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                tableElement.classList.add('ring-2', 'ring-[#ecab0f]');
                setTimeout(() => tableElement.classList.remove('ring-2', 'ring-[#ecab0f]'), 3000);
              }
            }, 500);
          }
          localStorage.removeItem('searchFilter');
        }
      };

      window.addEventListener('searchFilterUpdated', handleSearchFilter);
      return () => window.removeEventListener('searchFilterUpdated', handleSearchFilter);
    }, []);

  const { data: resData, isError } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    placeholderData: keepPreviousData,
  });

  if(isError) {
    enqueueSnackbar("¡Algo salió mal!", { variant: "error" })
  }

  console.log(resData);

  return (
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-10 py-4 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl md:text-2xl font-bold tracking-wider">
            Tables
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 w-full md:w-auto">
          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-sm md:text-lg ${
              status === "all" && "bg-[#383838] rounded-lg px-3 md:px-5 py-2"
            } rounded-lg px-3 md:px-5 py-2 font-semibold`}
          >
            Todas
          </button>
          <button
            onClick={() => setStatus("booked")}
            className={`text-[#ababab] text-sm md:text-lg ${
              status === "booked" && "bg-[#383838] rounded-lg px-3 md:px-5 py-2"
            } rounded-lg px-3 md:px-5 py-2 font-semibold`}
          >
            Ocupadas
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 px-4 md:px-10 py-6 flex-1 overflow-y-auto pb-24 justify-start content-start">
        {resData?.data?.data
          ?.filter((table) => status === "all" || (status === "booked" && table.status === "Booked"))
          .map((table) => {
          return (
            <TableCard
              key={table._id}
              id={table._id}
              name={table.tableNo}
              status={table.status}
              initials={table?.currentOrder?.customerDetails?.name || "Sin Nombre"}
              seats={table.seats}
            />
          );
        })}
      </div>

      <BottomNav />
    </section>
  );
};

export default Tables;
