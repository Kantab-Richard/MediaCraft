"use client";

import { api } from "@/lib/api";
import { AdminApiKey, AdminDashboard, AdminUser } from "@/types/admin";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Something went wrong";
}

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .getAdminDashboard()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, setData };
}

export function useAdminUsers() {
  const [data, setData] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .getAdminUsers()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, setData };
}

export function useAdminApiKeys() {
  const [data, setData] = useState<AdminApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .getAllApiKeys()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, setData };
}
