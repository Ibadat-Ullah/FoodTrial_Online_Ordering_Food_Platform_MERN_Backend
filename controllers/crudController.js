export default function crudController(Model) {
  return {
    list: async (_req, res) =>
      res.json(await Model.find().sort({ createdAt: -1 }).lean()),
    create: async (req, res) =>
      res.status(201).json(await Model.create(req.body)),
    get: async (req, res) => {
      const item = await Model.findById(req.params.id).lean();
      if (!item) return res.status(404).json({ message: "Record not found." });
      res.json(item);
    },
    update: async (req, res) => {
      if (!req.body || !Object.keys(req.body).length) {
        return res.status(400).json({ message: "Provide fields to update." });
      }
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        strict: "throw",
      });
      if (!item) return res.status(404).json({ message: "Record not found." });
      res.json(item);
    },
    remove: async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: "Record not found." });
      res.json({ message: "Record deleted.", id: item.id });
    },
  };
}
