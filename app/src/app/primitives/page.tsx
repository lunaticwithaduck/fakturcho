'use client';

import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  FileText,
  HelpCircle,
  Input,
  Plus,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectItem,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from '@design/components';

const buttonVariants = ['primary', 'secondary', 'ghost', 'danger'] as const;
const buttonSizes = ['sm', 'md', 'lg'] as const;
const badgeVariants = ['neutral', 'success', 'warning', 'danger'] as const;
const badgeLabels = {
  neutral: 'Чернова',
  success: 'Платена',
  warning: 'Просрочена',
  danger: 'Анулирана',
};

export default function PrimitivesPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-text">Дизайн система — Фактурчо</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-text">Бутони</h2>
        {buttonVariants.map((variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-3">
            {buttonSizes.map((size) => (
              <Button key={size} variant={variant} size={size}>
                Нова фактура
              </Button>
            ))}
            <Button variant={variant} disabled>
              Неактивен
            </Button>
          </div>
        ))}
        <Button asChild variant="secondary">
          <a href="#top">Като връзка (asChild)</a>
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input label="Име на клиент" placeholder="Въведете име" />
        <Input label="ЕИК" hint="Само за фирми" placeholder="123456789" />
        <Input label="Имейл" error="Полето е задължително" />
        <Input label="Телефон" disabled placeholder="Неактивно поле" />
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Textarea label="Бележки" placeholder="Допълнителна информация..." />
        <Select label="Вид документ" placeholder="Изберете вид">
          <SelectItem value="invoice">Фактура</SelectItem>
          <SelectItem value="proforma">Проформа фактура</SelectItem>
          <SelectItem value="credit">Кредитно известие</SelectItem>
        </Select>
      </section>

      <section className="flex flex-col gap-4">
        <Checkbox label="Регистрация по ЗДДС" defaultChecked />
        <Checkbox label="Изпрати известие по имейл" />
        <Checkbox label="Недостъпна опция" disabled />
        <RadioGroup defaultValue="invoice" className="flex flex-row flex-wrap gap-5">
          <RadioGroupItem value="invoice" label="Фактура" />
          <RadioGroupItem value="proforma" label="Проформа" />
          <RadioGroupItem value="quote" label="Оферта" />
        </RadioGroup>
        <Switch label="Известия по имейл" defaultChecked />
      </section>

      <section className="flex flex-wrap items-center gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="danger">Изтрий клиент</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Сигурни ли сте?</DialogTitle>
            <DialogDescription>
              Действието е необратимо и не може да бъде отменено.
            </DialogDescription>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">Действия</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Редактирай</DropdownMenuItem>
            <DropdownMenuItem>Дублирай</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Изтрий</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" iconLeft={HelpCircle}>
                Данъчна основа
              </Button>
            </TooltipTrigger>
            <TooltipContent>Сумата преди начисляване на ДДС</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          variant="secondary"
          onClick={() =>
            toast({ title: 'Фактурата е изпратена', description: 'Клиентът ще я получи по имейл.' })
          }
        >
          Покажи известие
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-text">Раздели</h2>
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Детайли</TabsTrigger>
            <TabsTrigger value="items">Артикули</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>
          <TabsContent value="details">Основна информация за документа.</TabsContent>
          <TabsContent value="items">Списък с артикули и цени.</TabsContent>
          <TabsContent value="history">Хронология на промените.</TabsContent>
        </Tabs>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        {badgeVariants.map((variant) => (
          <Badge key={variant} variant={variant}>
            {badgeLabels[variant]}
          </Badge>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="size-12 rounded-full" />
      </section>

      <Card className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-text">Обобщение</h2>
        <p className="text-sm text-text-muted">Дължима сума: 5 500,00 € / 10 757,07 лв.</p>
      </Card>

      <EmptyState
        icon={FileText}
        title="Няма издадени фактури"
        description="Издайте първата си фактура, за да я видите тук."
        action={
          <Button iconLeft={Plus} size="sm">
            Нова фактура
          </Button>
        }
      />

      <Toaster />
    </main>
  );
}
