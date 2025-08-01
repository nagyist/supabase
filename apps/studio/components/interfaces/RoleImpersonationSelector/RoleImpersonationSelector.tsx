import { useState } from 'react'

import { PostgrestRole } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { DropdownMenuSeparator, cn } from 'ui'
import { AnonIcon, AuthenticatedIcon, ServiceRoleIcon } from './Icons'
import RoleImpersonationRadio from './RoleImpersonationRadio'
import UserImpersonationSelector from './UserImpersonationSelector'

export interface RoleImpersonationSelectorProps {
  serviceRoleLabel?: string
  padded?: boolean
  disallowAuthenticatedOption?: boolean
}

const RoleImpersonationSelector = ({
  serviceRoleLabel,
  padded = true,
  disallowAuthenticatedOption = false,
}: RoleImpersonationSelectorProps) => {
  const state = useRoleImpersonationStateSnapshot()

  const [selectedOption, setSelectedOption] = useState<PostgrestRole | undefined>(() => {
    if (
      state.role?.type === 'postgrest' &&
      (state.role.role === 'anon' || state.role.role === 'authenticated')
    ) {
      return state.role.role
    }

    return 'service_role'
  })

  const isAuthenticatedOptionFullySelected = Boolean(
    selectedOption === 'authenticated' &&
      state.role?.type === 'postgrest' &&
      state.role.role === 'authenticated' &&
      (('user' in state.role && state.role.user) ||
        ('externalAuth' in state.role && state.role.externalAuth)) // Check for either auth type
  )

  function onSelectedChange(value: PostgrestRole) {
    if (value === 'service_role') {
      // do not set a role for service role
      // as the default role is the "service role"
      state.setRole(undefined)
    }

    if (value === 'anon') {
      state.setRole({
        type: 'postgrest',
        role: value,
      })
    }

    setSelectedOption(value)
  }

  return (
    <>
      <div className={cn('flex flex-col gap-3', padded ? 'p-5' : 'pb-5')}>
        <h2 className="text-foreground text-base">Database role settings</h2>

        <form
          onSubmit={(e) => {
            // don't allow form submission
            e.preventDefault()
          }}
        >
          <fieldset className="flex gap-3">
            <RoleImpersonationRadio
              value="service_role"
              isSelected={selectedOption === 'service_role'}
              onSelectedChange={onSelectedChange}
              label={serviceRoleLabel}
              icon={<ServiceRoleIcon isSelected={selectedOption === 'service_role'} />}
            />

            <RoleImpersonationRadio
              value="anon"
              isSelected={selectedOption === 'anon'}
              onSelectedChange={onSelectedChange}
              icon={<AnonIcon isSelected={selectedOption === 'anon'} />}
            />

            {!disallowAuthenticatedOption && (
              <RoleImpersonationRadio
                value="authenticated"
                isSelected={
                  selectedOption === 'authenticated' &&
                  (isAuthenticatedOptionFullySelected || 'partially')
                }
                onSelectedChange={onSelectedChange}
                icon={<AuthenticatedIcon isSelected={selectedOption === 'authenticated'} />}
              />
            )}
          </fieldset>
        </form>

        {selectedOption === 'service_role' && (
          <p className="text-foreground-light text-sm">
            The default Postgres/superuser role.
            {disallowAuthenticatedOption ? <br /> : ' '}
            This has admin privileges.
            <br />
            It will bypass Row Level Security (RLS) policies.
          </p>
        )}

        {selectedOption === 'anon' && (
          <p className="text-foreground-light text-sm">
            For "anonymous access".
            {disallowAuthenticatedOption ? <br /> : ' '}
            This is the role which the API (PostgREST)
            <br />
            will use when a user is not logged in.
            {disallowAuthenticatedOption ? <br /> : ' '}
            It will respect Row Level Security (RLS) policies.
          </p>
        )}

        {selectedOption === 'authenticated' && (
          <p className="text-foreground-light text-sm">
            For "authenticated access". This is the role which the API (PostgREST)
            <br />
            will use when a user is logged in. It will respect Row Level Security (RLS) policies.
          </p>
        )}
      </div>

      {selectedOption === 'authenticated' && (
        <>
          <DropdownMenuSeparator />
          <UserImpersonationSelector />
        </>
      )}
    </>
  )
}

export default RoleImpersonationSelector
