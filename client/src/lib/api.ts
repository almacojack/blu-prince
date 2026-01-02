import { TossFile } from "./toss";

export async function saveCartridge(file: TossFile) {
  const payload = {
    tngli_id: file.manifest.tngli_id,
    title: file.manifest.meta.title,
    version: file.manifest.meta.version,
    author: file.manifest.meta.author,
    toss_file: file,
  };

  // Check if exists first
  const existing = await getCartridge(file.manifest.tngli_id);
  
  if (existing) {
    // Update
    const response = await fetch(`/api/cartridges/${file.manifest.tngli_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to update cartridge");
    }

    return await response.json();
  } else {
    // Create
    const response = await fetch("/api/cartridges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to save cartridge");
    }

    return await response.json();
  }
}

export async function getAllCartridges() {
  const response = await fetch("/api/cartridges");
  if (!response.ok) {
    throw new Error("Failed to fetch cartridges");
  }
  return await response.json();
}

export async function getCartridge(tngli_id: string) {
  const response = await fetch(`/api/cartridges/${tngli_id}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to fetch cartridge");
  }
  return await response.json();
}

export async function deleteCartridge(tngli_id: string) {
  const response = await fetch(`/api/cartridges/${tngli_id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete cartridge");
  }
}
