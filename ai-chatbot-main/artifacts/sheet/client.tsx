import { parse, unparse } from "papaparse";
import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import {
  CopyIcon,
  LineChartIcon,
  RedoIcon,
  SparklesIcon,
  UndoIcon,
} from "@/components/icons";
import { SpreadsheetEditor } from "@/components/sheet-editor";

type Metadata = any;

export const sheetArtifact = new Artifact<"sheet", Metadata>({
  kind: "sheet",
  description: "Корисно для роботи з таблицями",
  initialize: () => null,
  onStreamPart: ({ setArtifact, streamPart }) => {
    if (streamPart.type === "data-sheetDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  content: ({ content, currentVersionIndex, onSaveContent, status }) => {
    return (
      <SpreadsheetEditor
        content={content}
        currentVersionIndex={currentVersionIndex}
        isCurrentVersion={true}
        saveContent={onSaveContent}
        status={status}
      />
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "Переглянути попередню версію",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: "Переглянути наступну версію",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <CopyIcon />,
      description: "Копіювати як .csv",
      onClick: ({ content }) => {
        const parsed = parse<string[]>(content, { skipEmptyLines: true });

        const nonEmptyRows = parsed.data.filter((row) =>
          row.some((cell) => cell.trim() !== "")
        );

        const cleanedCsv = unparse(nonEmptyRows);

        navigator.clipboard.writeText(cleanedCsv);
        toast.success("Скопійовано csv в буфер обміну!");
      },
    },
  ],
  toolbar: [
    {
      description: "\u0424\u043e\u0440\u043c\u0430\u0442\u0443\u0432\u0430\u0442\u0438 \u0442\u0430 \u043e\u0447\u0438\u0441\u0442\u0438\u0442\u0438 \u0434\u0430\u043d\u0456",
      icon: <SparklesIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            { type: "text", text: "Будь ласка, відформатуй і очисти дані." },
          ],
        });
      },
    },
    {
      description: "\u0410\u043d\u0430\u043b\u0456\u0437\u0443\u0432\u0430\u0442\u0438 \u0442\u0430 \u0432\u0456\u0437\u0443\u0430\u043b\u0456\u0437\u0443\u0432\u0430\u0442\u0438 \u0434\u0430\u043d\u0456",
      icon: <LineChartIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Будь ласка, проаналізуй та візуалізуй дані, створивши новий кодовий артефакт на Python.",
            },
          ],
        });
      },
    },
  ],
});
