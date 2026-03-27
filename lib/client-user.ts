"use client";

const USER_STORAGE_KEY = "hookah-soprano-demo-user";

export type DemoClientUser = {
  id: string;
  name: string;
  phone: string;
};

export function getOrCreateDemoUser(): DemoClientUser {
  if (typeof window === "undefined") {
    return {
      id: "web-demo-user",
      name: "",
      phone: ""
    };
  }

  const existing = window.localStorage.getItem(USER_STORAGE_KEY);
  if (existing) {
    return JSON.parse(existing) as DemoClientUser;
  }

  const created: DemoClientUser = {
    id: "web-demo-user",
    name: "",
    phone: ""
  };

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(created));
  return created;
}

export function updateDemoUserProfile(profile: Partial<DemoClientUser>) {
  if (typeof window === "undefined") {
    return;
  }

  const current = getOrCreateDemoUser();
  const next = { ...current, ...profile };
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
}
