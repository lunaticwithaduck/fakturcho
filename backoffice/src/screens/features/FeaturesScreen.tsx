import type { FeatureFlagKey } from '@fakturcho/shared-types';
import { List, Switch, Typography } from 'antd';
import { useUpdateFeatureFlagMutation } from '../../api';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { ApiErrorAlert } from '../../layout/ApiErrorAlert';
import { formatDate } from '../../utils/date';
import { FEATURE_FLAG_LABELS } from './featureFlagLabels';

export function FeaturesScreen() {
  const { data: flags, isLoading, isError } = useFeatureFlags();
  const [updateFlag, { isError: updateError }] = useUpdateFeatureFlagMutation();

  function handleToggle(key: FeatureFlagKey, enabled: boolean) {
    updateFlag({ key, enabled });
  }

  return (
    <div>
      <Typography.Title level={3}>Функции</Typography.Title>
      {isError || updateError ? <ApiErrorAlert /> : null}
      <List
        bordered
        loading={isLoading}
        dataSource={flags}
        renderItem={(flag) => {
          const label = FEATURE_FLAG_LABELS[flag.key];
          return (
            <List.Item
              actions={[
                <Switch
                  key="toggle"
                  checked={flag.enabled}
                  onChange={(enabled) => handleToggle(flag.key, enabled)}
                />,
              ]}
            >
              <List.Item.Meta
                title={label.title}
                description={
                  <>
                    <span>{label.description}</span>
                    <br />
                    <Typography.Text type="secondary">
                      Последна промяна: {formatDate(flag.updatedAt)}
                    </Typography.Text>
                  </>
                }
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
}
