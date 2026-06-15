const BASE_URL = "/todos";

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

const todoService = {
  getAll: () => fetch(BASE_URL).then(handleResponse),

  create: (title, description) =>
    fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    }).then(handleResponse),

  update: (id, updates) =>
    fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${BASE_URL}/${id}`, { method: "DELETE" }).then(handleResponse),
};

export default todoService;
