import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSimple, listSimple, reorderSimple, saveSimple, verifySampleTestResults, type SimpleTable } from "@/lib/api";
import type {
  ArticleCategory,
  CommunityVisit,
  Download,
  Faq,
  ImpactStat,
  JourneyMilestone,
  Partner,
  ProductCategory,
  PageSection,
  NavItem,
  ResearchItem,
  ShellPart,
  TeamMember,
  Testimonial,
  TestResult,
} from "@/lib/types";
import { ManagerPage, type Column, type FieldSpec } from "@/admin/shared";
import { Button, SampleBadge } from "@/components/ui";
import { useUIStore } from "@/store/ui";

function useGenericManager<T extends { id: string; sort_order?: number }>(table: SimpleTable) {
  const qc = useQueryClient();
  const pushToast = useUIStore((state) => state.pushToast);
  const query = useQuery({ queryKey: [table], queryFn: () => listSimple<T>(table, { includeSamples: true, includeUnpublished: true }) });

  async function save(item: Partial<T>) {
    await saveSimple(table, item as T & { id: string });
    await qc.invalidateQueries({ queryKey: [table] });
  }
  async function remove(item: T) {
    await deleteSimple(table, item.id);
    await qc.invalidateQueries({ queryKey: [table] });
  }
  async function reorder(ids: string[]) {
    try {
      await reorderSimple(table, ids);
    } catch (error) {
      pushToast(error instanceof Error ? `পুনর্বিন্যাস ব্যর্থ / Reorder failed: ${error.message}` : "পুনর্বিন্যাস ব্যর্থ / Reorder failed", "error");
    } finally {
      await qc.invalidateQueries({ queryKey: [table] });
    }
  }

  return { items: query.data ?? [], isLoading: query.isLoading, save, remove, reorder };
}

export function CategoriesManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<ArticleCategory>("article_categories");
  const fields: FieldSpec[] = [
    { kind: "text", key: "slug", label: "Slug", required: true },
    { kind: "bilingual-text", key: "name", label: "Name", required: true },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<ArticleCategory>[] = [
    { key: "name_bn", label: "নাম", render: (i) => `${i.name_bn} / ${i.name_en}` },
    { key: "slug", label: "Slug" },
  ];
  return (
    <ManagerPage
      title="বিভাগ / Categories"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ sort_order: items.length + 1 }}
    />
  );
}

export function ProductCategoriesManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<ProductCategory>("product_categories");
  const fields: FieldSpec[] = [
    { kind: "text", key: "slug", label: "Slug", required: true },
    { kind: "bilingual-text", key: "name", label: "Name", required: true },
    { kind: "number", key: "sort_order", label: "Sort order" },
    { kind: "boolean", key: "is_published", label: "Published" },
  ];
  const columns: Column<ProductCategory>[] = [
    { key: "name_bn", label: "নাম", render: (item) => `${item.name_bn} / ${item.name_en}` },
    { key: "slug", label: "Slug" },
    { key: "is_published", label: "Published", render: (item) => item.is_published ? "Yes" : "No" },
  ];
  return (
    <ManagerPage
      title="পণ্য বিভাগ / Product categories"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ sort_order: items.length + 1, is_published: true }}
    />
  );
}

export function JourneyManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<JourneyMilestone>("journey_milestones");
  const fields: FieldSpec[] = [
    { kind: "bilingual-text", key: "date_label", label: "Date label", required: true },
    { kind: "bilingual-text", key: "title", label: "Title", required: true },
    { kind: "bilingual-textarea", key: "body", label: "Body" },
    { kind: "image", key: "image", label: "Image URL" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<JourneyMilestone>[] = [
    { key: "date_label_bn", label: "তারিখ", render: (i) => i.date_label_bn },
    { key: "title_bn", label: "শিরোনাম", render: (i) => `${i.title_bn} / ${i.title_en}` },
  ];
  return (
    <ManagerPage
      title="যাত্রা / Journey"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ sort_order: items.length + 1 }}
    />
  );
}

export function ResearchManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<ResearchItem>("research_items");
  const fields: FieldSpec[] = [
    {
      kind: "select",
      key: "type",
      label: "Type",
      options: [
        { value: "method", label: "Method" },
        { value: "finding", label: "Finding" },
        { value: "limitation", label: "Limitation" },
        { value: "diagram", label: "Diagram" },
      ],
    },
    { kind: "bilingual-text", key: "title", label: "Title", required: true },
    { kind: "bilingual-textarea", key: "body", label: "Body" },
    { kind: "image", key: "image", label: "Image URL" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<ResearchItem>[] = [
    { key: "type", label: "Type" },
    { key: "title_bn", label: "শিরোনাম", render: (i) => `${i.title_bn} / ${i.title_en}` },
  ];
  return (
    <ManagerPage
      title="গবেষণা / Research"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ type: "finding", sort_order: items.length + 1 }}
    />
  );
}

export function TestResultsManager() {
  const qc = useQueryClient();
  const pushToast = useUIStore((state) => state.pushToast);
  const { items, isLoading, save, remove, reorder } = useGenericManager<TestResult>("test_results");
  async function markVerified() {
    try {
      await verifySampleTestResults();
      await qc.invalidateQueries({ queryKey: ["test_results"] });
      pushToast("নমুনা নয় এমন ফলাফল যাচাই হয়েছে / Non-sample results marked verified", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `আপডেট ব্যর্থ / Update failed: ${error.message}` : "আপডেট ব্যর্থ / Update failed", "error");
    }

  }
  const fields: FieldSpec[] = [
    { kind: "bilingual-text", key: "parameter", label: "Parameter", required: true },
    { kind: "text", key: "unit", label: "Unit" },
    { kind: "number", key: "raw_value", label: "Raw (before)" },
    { kind: "number", key: "filtered_value", label: "Filtered (after)" },
    { kind: "number", key: "control_value", label: "Control" },
    { kind: "number", key: "standard_value", label: "Standard value" },
    { kind: "text", key: "standard_source", label: "Standard source (ECR/DPHE, WHO)" },
    { kind: "text", key: "lab_name", label: "Lab name" },
    {
      kind: "select",
      key: "status",
      label: "Status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "sample", label: "Sample" },
        { value: "verified", label: "Verified" },
      ],
    },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<TestResult>[] = [
    { key: "parameter_bn", label: "প্যারামিটার", render: (i) => `${i.parameter_bn} / ${i.parameter_en}` },
    { key: "status", label: "Status", render: (i) => (i.is_sample || i.status === "sample" ? <SampleBadge label="Sample" /> : i.status) },
  ];
  return (
    <ManagerPage
      title="পরীক্ষার ফলাফল / Test results"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ status: "pending", is_sample: false, sort_order: items.length + 1 }}
      headerAction={<Button variant="secondary" onClick={markVerified}>নমুনা নয় এমন ফলাফল যাচাই / Verify non-sample results</Button>}
    />
  );
}

export function PageSectionsManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<PageSection>("page_sections");
  const fields: FieldSpec[] = [
    {
      kind: "select",
      key: "page_key",
      label: "Page",
      options: [
        { value: "coastal", label: "Coastal problem" },
        { value: "concerns", label: "Our concerns" },
        { value: "health", label: "Health topics" },
        { value: "terms", label: "Terms" },
        { value: "privacy", label: "Privacy" },
        { value: "refund", label: "Refunds and returns" },
        { value: "shipping", label: "Shipping policy" },
      ],
    },
    {
      kind: "select",
      key: "type",
      label: "Section type",
      options: ["text", "cards", "stats", "quote", "image", "cta"].map((value) => ({ value, label: value })),
    },
    { kind: "bilingual-text", key: "title", label: "Title" },
    { kind: "bilingual-textarea", key: "body", label: "Body" },
    { kind: "image", key: "image", label: "Image" },
    { kind: "text", key: "icon", label: "Icon name" },
    { kind: "text", key: "source_name", label: "Source name" },
    { kind: "text", key: "source_url", label: "Source URL" },
    { kind: "boolean", key: "is_sample", label: "Sample data" },
    { kind: "boolean", key: "is_visible", label: "Visible on public page" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<PageSection>[] = [
    { key: "page_key", label: "Page" },
    { key: "title_en", label: "Title" },
    {
      key: "source_name",
      label: "Source",
      render: (item) => item.type === "stats" && (!item.source_name || !item.source_url) ? <SampleBadge label="Needs citation" /> : item.source_name || "—",
    },
    { key: "is_visible", label: "Visible", render: (item) => item.is_visible ? "Yes" : "No" },
  ];
  return (
    <ManagerPage
      title="Page sections"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ page_key: "coastal", type: "cards", is_sample: false, is_visible: true, sort_order: items.length + 1 }}
      showPublished={false}
    />
  );
}

export function NavigationManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<NavItem>("nav_items");
  const fields: FieldSpec[] = [
    { kind: "bilingual-text", key: "label", label: "Menu label", required: true },
    { kind: "bilingual-textarea", key: "description", label: "Description" },
    { kind: "text", key: "path", label: "Path", required: true },
    { kind: "text", key: "icon", label: "Icon" },
    { kind: "text", key: "group_key", label: "Dropdown group" },
    { kind: "boolean", key: "is_visible", label: "Visible" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<NavItem>[] = [
    { key: "label_en", label: "Label" },
    { key: "path", label: "Path" },
    { key: "group_key", label: "Group" },
    { key: "is_visible", label: "Visible", render: (item) => item.is_visible ? "Yes" : "No" },
  ];
  return (
    <ManagerPage
      title="Navigation"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ parent_id: null, group_key: "", is_visible: true, sort_order: items.length + 1 }}
      showPublished={false}
    />
  );
}

export function ShellPartsManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<ShellPart>("shell_parts");
  const fields: FieldSpec[] = [
    { kind: "text", key: "key", label: "Part key", required: true },
    { kind: "bilingual-text", key: "name", label: "Name", required: true },
    { kind: "bilingual-textarea", key: "description", label: "Description" },
    { kind: "text", key: "icon", label: "Icon" },
    { kind: "text", key: "color", label: "Color token" },
    { kind: "number", key: "hotspot_x", label: "Hotspot X (%)" },
    { kind: "number", key: "hotspot_y", label: "Hotspot Y (%)" },
    { kind: "boolean", key: "is_visible", label: "Visible" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<ShellPart>[] = [
    { key: "name_en", label: "Shell part" },
    { key: "hotspot_x", label: "Hotspot", render: (part) => `${part.hotspot_x}%, ${part.hotspot_y}%` },
    { key: "is_visible", label: "Visible", render: (part) => part.is_visible ? "Yes" : "No" },
  ];
  return (
    <ManagerPage
      title="খোলসের গল্প / Shell Story Parts"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ key: "", hotspot_x: 50, hotspot_y: 50, linked_product_ids: [], is_visible: true, sort_order: items.length + 1 }}
      showPublished={false}
    />
  );
}

export function ImpactStatsManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<ImpactStat>("impact_stats");
  const fields: FieldSpec[] = [
    { kind: "bilingual-text", key: "label", label: "Label", required: true },
    { kind: "number", key: "value", label: "Value" },
    { kind: "text", key: "prefix", label: "Prefix" },
    { kind: "text", key: "suffix", label: "Suffix" },
    { kind: "select", key: "status", label: "Status", options: [
      { value: "sample", label: "Sample" },
      { value: "target", label: "Target" },
      { value: "verified", label: "Verified" },
    ] },
    { kind: "text", key: "icon", label: "Icon" },
    { kind: "bilingual-textarea", key: "description", label: "Description" },
    { kind: "text", key: "link", label: "Related page link" },
    { kind: "select", key: "size", label: "Card size", options: ["S", "M", "L"].map((value) => ({ value, label: value })) },
    { kind: "boolean", key: "is_featured", label: "Featured card" },
    { kind: "boolean", key: "is_sample", label: "Sample data" },
    { kind: "text", key: "source_name", label: "Source name" },
    { kind: "text", key: "source_url", label: "Source URL" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<ImpactStat>[] = [
    { key: "label_bn", label: "লেবেল", render: (i) => `${i.label_bn} / ${i.label_en}` },
    { key: "value", label: "Value", render: (i) => `${i.prefix}${i.value}${i.suffix}` },
  ];
  return (
    <ManagerPage
      title="প্রভাব পরিসংখ্যান / Impact stats"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ status: "sample", is_sample: true, size: "S", sort_order: items.length + 1 }}
    />
  );
}

export function TeamManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<TeamMember>("team_members");
  const fields: FieldSpec[] = [
    { kind: "text", key: "name", label: "Name", required: true },
    { kind: "bilingual-text", key: "title", label: "Title / role" },
    { kind: "text", key: "department", label: "Department" },
    { kind: "bilingual-textarea", key: "bio", label: "Bio" },
    { kind: "image", key: "photo_url", label: "Photo URL" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<TeamMember>[] = [
    { key: "name", label: "Name" },
    { key: "title_bn", label: "পদবি", render: (i) => `${i.title_bn} / ${i.title_en}` },
  ];
  return (
    <ManagerPage
      title="টিম / Team"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ group_type: "team", links: {}, sort_order: items.length + 1 }}
    />
  );
}

export function TestimonialsManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<Testimonial>("testimonials");
  const fields: FieldSpec[] = [
    { kind: "text", key: "name", label: "Name", required: true },
    { kind: "bilingual-text", key: "role", label: "Role" },
    { kind: "bilingual-textarea", key: "quote", label: "Quote" },
    { kind: "image", key: "avatar_url", label: "Avatar URL" },
    { kind: "boolean", key: "is_sample", label: "Sample data" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<Testimonial>[] = [
    { key: "name", label: "Name" },
    { key: "is_sample", label: "Sample?", render: (i) => (i.is_sample ? <SampleBadge label="Sample" /> : "—") },
  ];
  return (
    <ManagerPage
      title="মতামত / Testimonials"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ is_sample: true, sort_order: items.length + 1 }}
    />
  );
}

export function FaqsManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<Faq>("faqs");
  const fields: FieldSpec[] = [
    { kind: "bilingual-text", key: "question", label: "Question", required: true },
    { kind: "bilingual-textarea", key: "answer", label: "Answer" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<Faq>[] = [{ key: "question_bn", label: "প্রশ্ন", render: (i) => i.question_bn }];
  return (
    <ManagerPage
      title="প্রশ্নোত্তর / FAQs"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ sort_order: items.length + 1 }}
    />
  );
}

export function PartnersManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<Partner>("partners");
  const fields: FieldSpec[] = [
    { kind: "text", key: "name", label: "Name", required: true },
    { kind: "image", key: "logo_url", label: "Logo URL" },
    { kind: "text", key: "url", label: "Website URL" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<Partner>[] = [{ key: "name", label: "Name" }];
  return (
    <ManagerPage
      title="অংশীদার / Partners"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ sort_order: items.length + 1 }}
    />
  );
}

export function DownloadsManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<Download>("downloads");
  const fields: FieldSpec[] = [
    { kind: "bilingual-text", key: "title", label: "Title", required: true },
    { kind: "file", key: "file_url", label: "File URL" },
    { kind: "text", key: "file_type", label: "File type (pdf)" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<Download>[] = [{ key: "title_bn", label: "শিরোনাম", render: (i) => i.title_bn }];
  return (
    <ManagerPage
      title="ডাউনলোড / Downloads"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={save}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ file_type: "pdf", sort_order: items.length + 1 }}
    />
  );
}

export function CommunityManager() {
  const { items, isLoading, save, remove, reorder } = useGenericManager<CommunityVisit>("community_visits");
  const fields: FieldSpec[] = [
    { kind: "bilingual-text", key: "title", label: "Visit title", required: true },
    { kind: "bilingual-textarea", key: "description", label: "Description" },
    { kind: "image", key: "cover_image", label: "Cover image URL" },
    { kind: "photos", key: "photos", label: "Visit photos" },
    { kind: "number", key: "sort_order", label: "Sort order" },
  ];
  const columns: Column<CommunityVisit>[] = [
    { key: "title_bn", label: "পরিদর্শন", render: (i) => `${i.title_bn} (${i.photos?.length ?? 0} photos)` },
  ];
  return (
    <ManagerPage
      title="কমিউনিটি পরিদর্শন / Community visits"
      fields={fields}
      columns={columns}
      items={items}
      isLoading={isLoading}
      onSave={(values) => save({ ...values, photos: (values as CommunityVisit).photos ?? [] })}
      onDelete={remove}
      onReorder={reorder}
      emptyItem={{ sort_order: items.length + 1, photos: [] }}
    />
  );
}
