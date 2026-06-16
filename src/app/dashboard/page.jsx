"use client";

import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { TableTemplate } from "@/components/TableTemplate";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(false);

  const [agents, setAgents] = useState({});

  const [agentName, setAgentName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [agentVersion, setAgentVersion] = useState("");

  const [showSelector, setShowSelector] = useState(true);

  // ---------------- FILTER + SORT ----------------
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "timestamp",
    direction: "desc",
  });

  // ---------------- LOAD AGENTS ----------------
  useEffect(() => {
    const loadAgents = async () => {
      const res = await fetch("/api/agents");
      const result = await res.json();
      setAgents(result.data || {});
    };

    loadAgents();
  }, []);

  // ---------------- FETCH ALL ----------------
  const fetchAllTraces = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/getTraces");
      const result = await res.json();
      setTraces(result.data || []);
      setShowSelector(false);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH FILTERED ----------------
  const fetchFilteredTraces = async () => {
    if (!agentName || !agentId || !agentVersion) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/getTraces?agentName=${agentName}&agentId=${agentId}&version=${agentVersion}`
      );

      const result = await res.json();
      setTraces(result.data || []);
      setShowSelector(false);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DERIVED ----------------
  const agentNames = [
    ...new Set(Object.keys(agents).map(k => k.split("|")[0])),
  ];

  const agentIds = [
    ...new Set(
      Object.keys(agents)
        .filter(k => k.split("|")[0] === agentName)
        .map(k => k.split("|")[1])
    ),
  ];

  const versions = [
    ...new Set(
      Object.keys(agents)
        .filter(k => {
          const [name, id] = k.split("|");
          return name === agentName && id === agentId;
        })
        .map(k => k.split("|")[2])
    ),
  ];

  // ---------------- SAFE FIELD VALUE ----------------
  const getFieldValue = (trace, field) => {
    switch (field) {
      case "input":
        return trace.input ?? "";

      case "output":
        return trace.output ?? "";

      case "model":
        return trace.metadata?.model ?? "";

      case "provider":
        return trace.metadata?.provider ?? "";

      case "inputTokens":
        return Number(trace.metadata?.inputTokens ?? 0);

      case "outputTokens":
        return Number(trace.metadata?.outputTokens ?? 0);

      case "totalTokens":
        return Number(trace.metadata?.totalTokens ?? 0);

      default:
        return trace[field] ?? "";
    }
  };

  // ---------------- FILTER ----------------
  const matchesFilter = (trace, filter) => {
    const source = String(getFieldValue(trace, filter.field) ?? "").toLowerCase();
    const target = String(filter.value ?? "").toLowerCase();

    switch (filter.operator) {
      case "contains":
        return source.includes(target);
      case "notContains":
        return !source.includes(target);
      case "equals":
        return source === target;
      case "notEquals":
        return source !== target;
      default:
        return true;
    }
  };

  // ---------------- FILTER + SORT PIPELINE ----------------
  const processedTraces = useMemo(() => {
    let data = [...traces];

    // FILTER
    if (filters.length > 0) {
      data = data.filter(trace =>
        filters.every(f => matchesFilter(trace, f))
      );
    }

    // SORT
    data.sort((a, b) => {
      const aValue = getFieldValue(a, sortConfig.field);
      const bValue = getFieldValue(b, sortConfig.field);

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const aIsString = typeof aValue === "string";
      const bIsString = typeof bValue === "string";

      // STRING SORT
      if (aIsString || bIsString) {
        return sortConfig.direction === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      }

      // NUMBER SORT
      return sortConfig.direction === "asc"
        ? aValue - bValue
        : bValue - aValue;
    });

    return data;
  }, [traces, filters, sortConfig]);

  // ---------------- ACTIONS ----------------
  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const addFilter = (filter) => setFilters(prev => [...prev, filter]);
  const removeFilter = (i) => setFilters(prev => prev.filter((_, idx) => idx !== i));
  const clearFilters = () => setFilters([]);

  // ---------------- UI ----------------
  return (
    <SidebarProvider>
      <AppSidebar
        filters={filters}
        addFilter={addFilter}
        removeFilter={removeFilter}
        clearFilters={clearFilters}
      />

      <SidebarInset>
        <header className="h-16 flex items-center px-4 border-b">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Metrics
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* ---------------- POPUP ---------------- */}
        {showSelector && (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Agent</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <select
                  className="border p-2 w-full"
                  value={agentName}
                  onChange={(e) => {
                    setAgentName(e.target.value);
                    setAgentId("");
                    setAgentVersion("");
                  }}
                >
                  <option value="">Agent Name</option>
                  {agentNames.map(n => <option key={n}>{n}</option>)}
                </select>

                <select
                  className="border p-2 w-full"
                  value={agentId}
                  onChange={(e) => {
                    setAgentId(e.target.value);
                    setAgentVersion("");
                  }}
                >
                  <option value="">Agent ID</option>
                  {agentIds.map(id => <option key={id}>{id}</option>)}
                </select>

                <select
                  className="border p-2 w-full"
                  value={agentVersion}
                  onChange={(e) => setAgentVersion(e.target.value)}
                >
                  <option value="">Version</option>
                  {versions.map(v => <option key={v}>{v}</option>)}
                </select>

                <div className="flex gap-2">
                  <Button onClick={fetchFilteredTraces}>
                    Load Traces
                  </Button>

                  <Button variant="outline" onClick={fetchAllTraces}>
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---------------- LOADING ---------------- */}
        {loading && (
          <div className="p-10 flex justify-center">
            <Spinner />
          </div>
        )}

        {/* ---------------- TABLE ---------------- */}
        {!loading && (
          <TableTemplate
            data={processedTraces}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}